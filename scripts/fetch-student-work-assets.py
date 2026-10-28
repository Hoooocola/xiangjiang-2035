"""Fetch public Pinwall covers and attachment availability for the course showcase.

Run after import-student-works.py. Never save signed URLs, credentials or full PDFs.
Images are local thumbnails so the lecture does not rely on expiring CDN links.
Requires Pillow for thumbnail output; failures remain explicit placeholder states.
"""
import concurrent.futures
import hashlib
import html
import io
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 25 * 1024 * 1024


def read_url(url):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    request = urllib.request.Request(url, headers={"User-Agent": "Xiangjiang2035-CourseShowcase/1.0"})
    with opener.open(request, timeout=20) as response:
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("Asset exceeded size limit")
        return data


def fetch(work):
    result = {"cover": None, "hasPdf": False, "status": "unavailable", "projectUrl": work["projectUrl"]}
    try:
        page = read_url(work["projectUrl"]).decode("utf-8")
        result["hasPdf"] = bool(re.search(r"https://oss\.pinwall\.cn/pdf/[^\s\"'<>]+\.pdf", page))
        result["status"] = "available"
        result["checkedAt"] = datetime.now(timezone.utc).isoformat()
        candidates = re.findall(r"<img[^>]+src=[\"'](https://oss\.pinwall\.cn/images/[^\"']+)", page)
        if candidates:
            image_bytes = read_url(html.unescape(candidates[0]))
            with Image.open(io.BytesIO(image_bytes)) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                image.thumbnail((960, 960))
                output = ROOT / "public/student-works" / f"{work['id']}.webp"
                output.parent.mkdir(parents=True, exist_ok=True)
                image.save(output, "WEBP", quality=82)
                result["cover"] = f"/student-works/{output.name}"
                result["sha256"] = hashlib.sha256(output.read_bytes()).hexdigest()
        else:
            result["status"] = "no-cover"
    except Exception as error:
        # Report class only: exception messages may contain expiring signed URLs.
        result["status"] = f"fetch-failed:{type(error).__name__}"
    print(work["id"], result["status"], "cover" if result["cover"] else "placeholder", "pdf" if result["hasPdf"] else "project-page", flush=True)
    return work["id"], result


works = json.loads((ROOT / "src/student-works/source.json").read_text(encoding="utf-8"))
existing = json.loads((ROOT / "src/student-works/assets.json").read_text(encoding="utf-8"))
if "--retry-failed" in sys.argv:
    works = [work for work in works if not existing.get(work["id"], {}).get("cover")]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    assets = dict(pool.map(fetch, works))
assets = {**existing, **assets}
(ROOT / "src/student-works/assets.json").write_text(json.dumps(assets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
