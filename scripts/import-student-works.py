"""Read the supplied XLSX without changing it. Uses Python standard library only.

Usage: python scripts/import-student-works.py /absolute/path/to/source.xlsx
Outputs the course-only source dataset, with original fields and file provenance.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
ALIASES = {
    "铜官窑": "tongguan", "鹅洲岛": "ezhou", "巴溪洲": "baxi",
    "渔人码头": "site-011", "橘子洲": "juzizhou", "洋湖湿地": "yanghu",
    "潮宗街": "site-031", "北辰三角洲": "student-beichen",
    "油脂厂1936": "student-oil1936", "橘子洲大桥": "student-juzizhou-bridge",
    "猴子石大桥西岸": "student-houzishi-west",
}


def main():
    source = Path(sys.argv[1])
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    with ZipFile(source) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ["".join(n.itertext()) for n in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        sheet_name = ET.fromstring(archive.read("xl/workbook.xml")).find("s:sheets/s:sheet", NS).get("name")
        works = []
        for row in sheet.findall("s:sheetData/s:row", NS):
            values = {}
            for cell in row.findall("s:c", NS):
                column = re.sub(r"\d", "", cell.get("r"))
                value = cell.find("s:v", NS)
                if cell.get("t") == "inlineStr":
                    text = "".join(t.text or "" for t in cell.findall(".//s:t", NS))
                elif value is None:
                    continue
                elif cell.get("t") == "s":
                    text = shared[int(value.text)]
                else:
                    text = value.text
                values[column] = text
            if not values.get("A", "").isdigit() or not values.get("B"):
                continue
            number = int(values["A"])
            url = values.get("E", "")
            if not re.fullmatch(r"https://pinwall\.cn/project/\d+", url):
                raise ValueError(f"Unexpected source URL in row {row.get('r')}")
            site = values.get("F", "")
            notes = []
            if number == 18:
                notes.append("题目提及巴溪洲，原选址为大王山；保留原表，地点待核对。")
            if number == 19:
                notes.extend(["选址文本被截断，未推断完整路线或地点。", "分类单元格为产业规划与场景营造，与表尾“第19组未填写项目方向”备注冲突，待核对。"])
            project_id = url.rsplit("/", 1)[-1]
            works.append({
                "id": f"pinwall-{project_id}", "sequence": number,
                "title": values["B"], "members": values.get("D", "").split("、"),
                "theme": values.get("C", ""), "originalSite": site,
                "originalSiteType": values.get("G", ""), "placeId": ALIASES.get(site),
                "locationNote": "复用现有地点或有来源的近似导航点，非研究范围。" if site in ALIASES else "原选址尚无可靠坐标或范围；保留作品，暂不上图。",
                "reviewNotes": notes, "projectUrl": url, "pdfUrl": None, "cover": None,
                "source": {"file": source.name, "sha256": digest, "sheet": sheet_name, "row": int(row.get("r"))},
            })
    if not works:
        raise ValueError("No student work rows found")
    output = ROOT / "src/student-works/source.json"
    output.write_text(json.dumps(works, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(works)} works; source SHA256 {digest}")


if __name__ == "__main__":
    main()
