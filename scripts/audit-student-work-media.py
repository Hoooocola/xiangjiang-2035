"""Read public course pages and compare with the supplied Excel; never download video bodies.

Use the bundled Python (openpyxl). Raw upstream pages stay under ignored .audit/.
Only sanitized metadata, canonical paths and single-byte access results enter the repository.
"""
import argparse
import concurrent.futures
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import unicodedata
from urllib.parse import urlsplit
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.audit/pinwall-v4'
FOLDER = 'https://pinwall.cn/website/topics/getTopicAndArtifactById?limit=1000&offset=0&topicId=1725&score=0'


def normalized(value):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', value or ''))


class ProjectPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = None
        self.title = ''
        self.members = []
        self.abstract = ''
        self.buffer = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h2' and not self.title:
            self.active = 'title'
            self.buffer = []
        elif tag == 'p' and attrs.get('class') in ('name', 'abstract'):
            self.active = attrs['class']
            self.buffer = []

    def handle_data(self, data):
        if self.active:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if self.active and tag in ('h2', 'p'):
            value = ''.join(self.buffer).strip()
            if self.active == 'title': self.title = value
            elif self.active == 'name': self.members.append(value)
            else: self.abstract = value
            self.active = None


def curl_page(url, path):
    result = subprocess.run(['curl.exe', '--noproxy', '*', '-sS', '--max-time', '30',
                             '--max-filesize', '1048576', '-o', str(path), '-w', '%{http_code}', url],
                            capture_output=True, timeout=35)
    return result.stdout.decode('ascii', 'replace').strip() if result.returncode == 0 else 'network-error'


def probe(url):
    # These attachments are GET-signed; HEAD can return SignatureDoesNotMatch.
    # Download at most one byte when Range is supported; abort if a server ignores it.
    result = subprocess.run(['curl.exe', '--noproxy', '*', '-sS', '--range', '0-0',
                             '--max-filesize', '1024', '--max-time', '12', '-o', 'NUL',
                             '-w', '%{http_code}|%{content_type}', url], capture_output=True, timeout=16)
    parts = result.stdout.decode('ascii', 'replace').strip().split('|', 1)
    return {'method':'GET Range bytes=0-0', 'status':parts[0] if parts else 'network-error',
            'contentType':parts[1] if len(parts)>1 else '', 'transferOk':result.returncode == 0}


def attachments(page, folder, extensions):
    result = {}
    for raw in re.findall(r'https://oss\.pinwall\.cn/' + folder + r'/[^\s\x22\x27<>]+', page):
        url = html.unescape(raw)
        parsed = urlsplit(url)
        if parsed.hostname == 'oss.pinwall.cn' and re.fullmatch(r'/' + folder + r'/[A-Za-z0-9_-]+\.(' + extensions + ')', parsed.path):
            result[parsed.path] = url
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--excel', required=True)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--probe-cached', action='store_true', help='Probe attachments from recently cached public pages')
    args = parser.parse_args()
    import openpyxl
    excel = Path(args.excel)
    digest = hashlib.sha256(excel.read_bytes()).hexdigest()
    sheet = openpyxl.load_workbook(excel, read_only=True, data_only=True).worksheets[0]
    rows = {row[0]: (i, row) for i, row in enumerate(sheet.values, 1) if isinstance(row[0], int)}
    works = json.loads((ROOT / 'src/student-works/source.json').read_text(encoding='utf-8'))
    covers = json.loads((ROOT / 'src/student-works/assets.json').read_text(encoding='utf-8'))
    CACHE.mkdir(parents=True, exist_ok=True)
    if args.refresh:
        folder_status = curl_page(FOLDER, CACHE / 'folder.json')
        print('folder', folder_status, flush=True)
    folder_data = json.loads((CACHE / 'folder.json').read_text(encoding='utf-8')) if (CACHE / 'folder.json').exists() else {}
    folder_items = {str(item['Id']): item for item in folder_data.get('data', {}).get('rows', {}).get('artifacts', [])}

    def audit(work):
        project_id = work['id'].removeprefix('pinwall-')
        path = CACHE / (project_id + '.html')
        status = curl_page(work['projectUrl'], path) if args.refresh else ('200' if path.exists() else 'not-checked')
        page = path.read_text(encoding='utf-8') if path.exists() and status == '200' else ''
        parsed = ProjectPage()
        parsed.feed(page)
        row_number, row = rows[work['sequence']]
        excel_match = (work['source']['sha256'] == digest and row_number == work['source']['row'] and
                       [work['title'], work['theme'], '、'.join(work['members']), work['projectUrl'], work['originalSite'], work['originalSiteType']] == list(row[1:7]))
        item = folder_items.get(project_id, {})
        canonical_cover = urlsplit(item.get('profileImage', ''))._replace(query='', fragment='').geturl()
        cover = covers[work['id']]
        pdfs = attachments(page, 'pdf', 'pdf')
        videos = attachments(page, 'video', 'mp4|webm|m4v|mov')
        video_items = []
        for index, (resource_path, signed_url) in enumerate(videos.items(), 1):
            check = probe(signed_url) if args.refresh or args.probe_cached else {'status': 'not-checked', 'contentType': ''}
            accessible = check['status'] in ('200', '206') and check['contentType'].startswith('video/') and check.get('transferOk', False)
            video_items.append({'id': Path(resource_path).stem, 'title': f'作品视频 {index}', 'sourceUrl': work['projectUrl'],
                                'resourcePath': resource_path, 'provider': 'Pinwall / OSS',
                                'accessStatus': 'verified' if accessible else 'unverified', 'embedStatus': 'unverified',
                                'loginRequired': 'no' if accessible else 'unknown', 'accessProbe': check,
                                'evidence': '作品实际页面附件链接（非仅播放图标）；GET Range 单字节检查，不下载完整视频。'})
        pdf_items = [{'resourcePath': p, 'accessProbe': probe(url) if args.refresh or args.probe_cached else {'status': 'not-checked', 'contentType': ''}} for p, url in pdfs.items()]
        result = {'projectUrl': work['projectUrl'], 'checkedAt': datetime.now(timezone.utc).isoformat(),
                  'pageStatus': status, 'excelMatch': excel_match, 'excelSha256':digest, 'sourceRow': row_number,
                  'titleMatch': normalized(parsed.title) == normalized(work['title']),
                  'membersMatch': set(map(normalized, parsed.members)) == set(map(normalized, work['members'])),
                  'coverMatch': bool(canonical_cover) and canonical_cover == cover['coverSource'],
                  'coverSha256Match': hashlib.sha256((ROOT / 'public' / cover['coverImage'].lstrip('/')).read_bytes()).hexdigest() == cover['sha256'],
                  'abstractSha256': hashlib.sha256(parsed.abstract.encode('utf-8')).hexdigest(), 'pdfs': pdf_items, 'videos': video_items,
                  'videoSurveyStatus': 'checked-public-page' if page else 'unverified'}
        print(work['id'], status, 'excel', excel_match, 'pdf', len(pdfs), 'video', len(videos), flush=True)
        return work['id'], result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = dict(pool.map(audit, works))
    (ROOT / 'src/student-works/media-audit.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    media = {key: {'checkedAt': result['checkedAt'], 'pdfs':[{'id':Path(pdf['resourcePath']).stem} for pdf in result['pdfs']], 'videos': [
        {field: video[field] for field in ('id', 'title', 'sourceUrl', 'provider', 'accessStatus', 'embedStatus', 'loginRequired', 'evidence')}
        for video in result['videos']]} for key, result in results.items()}
    (ROOT / 'src/student-works/media.json').write_text(json.dumps(media, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Summary', json.dumps({'works': len(results), 'excel': sum(r['excelMatch'] for r in results.values()),
                                'pages': sum(r['pageStatus'] == '200' for r in results.values()),
                                'videos': sum(len(r['videos']) for r in results.values())}), flush=True)


if __name__ == '__main__':
    main()
