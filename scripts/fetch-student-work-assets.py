"""Verify Pinwall course project IDs, titles and full author groups; cache official covers.

Only the public workFolder profileImage is a cover. Never use a detail-page image
or a PDF page as fallback. Original source spreadsheet fields stay unchanged.
Run with the bundled Python/Pillow runtime. Signed URLs exist in memory only.
"""
import concurrent.futures
import hashlib
import io
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
FOLDER_URL = "https://pinwall.cn/workFolder/1725"
CATALOG_URL = "https://pinwall.cn/website/topics/getTopicAndArtifactById?limit=1000&offset=0&topicId=1725&score=0"
MAX_BYTES = 25 * 1024 * 1024


def read_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in {"pinwall.cn", "oss.pinwall.cn"}:
        raise ValueError("Unexpected asset origin")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(urllib.request.Request(url, headers={"User-Agent": "Xiangjiang2035-CourseShowcase/2.0"}), timeout=25) as response:
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("Asset exceeded size limit")
        return data


def normalized(text):
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", text))


def main():
    works = json.loads((ROOT / "src/student-works/source.json").read_text(encoding="utf-8"))
    previous = json.loads((ROOT / "src/student-works/assets.json").read_text(encoding="utf-8"))
    response = json.loads(read_url(CATALOG_URL))
    if response.get("status") != 200:
        raise ValueError("Public course catalog unavailable")
    projects = {str(item["Id"]): item for item in response["data"]["rows"]["artifacts"]}

    def verify(work):
        result = {"coverImage": None, "coverStatus": "missing", "coverSource": None,
                  "hasPdf": previous.get(work["id"], {}).get("hasPdf", False),
                  "pinwallUrl": work["projectUrl"], "checkedAt": datetime.now(timezone.utc).isoformat()}
        proof = {"projectId": work["id"].replace("pinwall-", ""), "sourceRow": work["source"]["row"],
                 "originalSite": work["originalSite"], "folderUrl": FOLDER_URL}
        item = projects.get(proof["projectId"])
        if item:
            publisher = item.get("user", {}).get("fullname", "")
            members = [publisher] + [member.get("user", {}).get("fullname", "") for member in item.get("artifact_teamworkers", [])]
            members = list(dict.fromkeys(name for name in members if name))
            proof.update({"pinwallTitle": item["name"], "pinwallMembers": members,
                          "titleMatch": normalized(item["name"]) == normalized(work["title"]),
                          "membersMatch": set(map(normalized, members)) == set(map(normalized, work["members"])),
                          "publisherMatch": normalized(publisher) in set(map(normalized, work["members"]))})
            cover_url = item.get("profileImage")
            if cover_url:
                parsed = urllib.parse.urlsplit(cover_url)
                result["coverSource"] = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))
                result["coverStatus"] = "unverified"
                try:
                    if parsed.hostname != "oss.pinwall.cn" or not parsed.path.startswith("/images/"):
                        raise ValueError("Not a public project cover image")
                    image_bytes = read_url(cover_url)
                    with Image.open(io.BytesIO(image_bytes)) as image:
                        image = ImageOps.exif_transpose(image).convert("RGB")
                        proof["originalSize"] = list(image.size)
                        image.thumbnail((1200, 1200))
                        output = ROOT / "public/student-works" / f"{work['id']}.webp"
                        image.save(output, "WEBP", quality=90, method=6)
                        result["coverImage"] = f"/student-works/{output.name}"
                        result["sha256"] = hashlib.sha256(output.read_bytes()).hexdigest()
                    if proof["titleMatch"] and proof["membersMatch"] and proof["publisherMatch"]:
                        result["coverStatus"] = "verified"
                    result["status"] = "available"
                except Exception as error:
                    result["status"] = f"fetch-failed:{type(error).__name__}"
            else:
                result["status"] = "missing-project-cover"
        else:
            result["status"] = "project-not-in-course-folder"
        result["matchEvidence"] = proof
        print(work["id"], result["coverStatus"], result.get("status"), proof.get("originalSize"), flush=True)
        return work["id"], result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        assets = dict(pool.map(verify, works))
    (ROOT / "src/student-works/assets.json").write_text(json.dumps(assets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    from collections import Counter
    print("Cover status:", dict(Counter(item["coverStatus"] for item in assets.values())), flush=True)


if __name__ == "__main__":
    main()
