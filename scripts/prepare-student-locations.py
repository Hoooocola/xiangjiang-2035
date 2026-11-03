"""Derive four showcase navigation points from already versioned OSM data.

This does not update the place registry, GIS geometry, camera configuration or AOI.
The points are navigation references, not verified student research boundaries.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
elements = {}
for path in sorted((ROOT / "data/osm").glob("*.json")):
    for element in json.loads(path.read_text(encoding="utf-8")).get("elements", []):
        elements[(element["type"], element["id"])] = element


def points(kind, identifier, seen=None):
    seen = set() if seen is None else seen
    key = (kind, identifier)
    if key in seen:
        return []
    seen.add(key)
    item = elements.get(key, {})
    if kind == "node":
        return [[item["lon"], item["lat"]]] if "lon" in item else []
    if kind == "way":
        return [p for node in item.get("nodes", []) for p in points("node", node, seen)]
    return [p for member in item.get("members", []) for p in points(member["type"], member["ref"], seen)]


specs = [
    ("student-beichen", "北辰三角洲", "community", "relation", 16162256, "center"),
    ("student-oil1936", "油脂厂1936", "infrastructure", "way", 1298905852, "center"),
    ("student-juzizhou-bridge", "橘子洲大桥", "waterfront", "way", 52072501, "center"),
    ("student-houzishi-west", "猴子石大桥西岸", "waterfront", "way", 30610573, "west"),
]
locations = []
for identifier, name, category, kind, osm_id, method in specs:
    geometry = points(kind, osm_id)
    if not geometry:
        raise ValueError(f"Missing versioned OSM geometry for {name}")
    lon = [p[0] for p in geometry]
    lat = [p[1] for p in geometry]
    coordinate = min(geometry, key=lambda p: p[0]) if method == "west" else [(min(lon) + max(lon)) / 2, (min(lat) + max(lat)) / 2]
    locations.append({
        "id": identifier, "name": name, "coordinate": [round(n, 7) for n in coordinate],
        "siteCategory": category,
        "source": f"https://www.openstreetmap.org/{kind}/{osm_id}",
        "precision": "现有 OSM 几何的西端导航点，非西岸研究范围" if method == "west" else "现有 OSM 几何包围盒中心，仅供近似导航，非研究范围",
    })
(ROOT / "src/student-works/locations.json").write_text(json.dumps(locations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Prepared {len(locations)} source-backed showcase points")
