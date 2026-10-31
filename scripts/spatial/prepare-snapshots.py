"""Normalize downloaded official HTML + GBIF JSON; no credentials or full web pages archived.
Usage: python3 scripts/spatial/prepare-snapshots.py water.html gbif.json
"""
import json,sys,hashlib,datetime,re
from pathlib import Path
from html.parser import HTMLParser
out=Path('public/data/spatial');out.mkdir(parents=True,exist_ok=True)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,t,a):
  if t=='tr':self.row=[]
  if t in ('td','th'):self.cell=[]
 def handle_data(self,d):
  if self.cell is not None:self.cell.append(d)
 def handle_endtag(self,t):
  if t in ('td','th') and self.cell is not None:
   if self.row is not None:self.row.append(''.join(self.cell).strip().replace('\u2002','').replace('\xa0',''))
   self.cell=None
  if t=='tr' and self.row is not None:self.rows.append(self.row);self.row=None
raw=Path(sys.argv[1]).read_bytes();p=Tables();p.feed(raw.decode());rows=[r for r in p.rows if len(r)==9 and r[1]=='湘江' and r[3]=='长沙市']
assert rows and all(r[6] in ['Ⅰ类','Ⅱ类','Ⅲ类','Ⅳ类','Ⅴ类','劣Ⅴ类'] for r in rows)
water={'sourceId':'hunan-water-2025-11','sourceUrl':'https://sthjt.hunan.gov.cn/sthjt/xxgk/zdly/hjjc/hjzl/202512/t20251222_33876308.html','period':{'start':'2025-11-01','end':'2025-11-30'},'publishedAt':'2025-12-22','retrievedAt':now,'rawSha256':hashlib.sha256(raw).hexdigest(),'records':[dict(id='hunan-water-2025-11-'+r[0],basin=r[1],river=r[2],city=r[3],district=r[4],sectionName=r[5],waterQualityClass=r[6],exceedingIndicators=r[7] or None,network=r[8],geometry=None,positionStatus='unverified') for r in rows]}
(out/'water-quality-2025-11.json').write_text(json.dumps(water,ensure_ascii=False,indent=2))
d=json.loads(Path(sys.argv[2]).read_text());accepted=[];rejected=0
for x in d['results']:
 lon=x.get('decimalLongitude');lat=x.get('decimalLatitude');u=x.get('coordinateUncertaintyInMeters');license=x.get('license','')
 if not isinstance(lon,(float,int)) or not isinstance(lat,(float,int)) or not 112.90<=lon<=113.02 or not 28.10<=lat<=28.27 or not isinstance(u,(float,int)) or not 0<u<=1000 or not re.fullmatch(r'https?://creativecommons\.org/(licenses/by/4\.0|publicdomain/zero/1\.0)(/legalcode)?/?',license) or x.get('hasGeospatialIssues') or not x.get('eventDate') or x['eventDate'][:10]>'2026-10-29':rejected+=1;continue
 accepted.append({'type':'Feature','id':'gbif-'+str(x['key']),'geometry':{'type':'Point','coordinates':[lon,lat]},'properties':dict(gbifId=x['key'],scientificName=x.get('scientificName'),species=x.get('species'),observedAt=x['eventDate'],coordinateUncertaintyInMeters=u,sourceUrl='https://www.gbif.org/occurrence/'+str(x['key']),datasetKey=x['datasetKey'],datasetUrl='https://www.gbif.org/dataset/'+x['datasetKey'],license=license,basisOfRecord=x.get('basisOfRecord'),sourceId='gbif-core-snapshot')})
(out/'gbif-core.geojson').write_text(json.dumps({'type':'FeatureCollection','features':accepted},ensure_ascii=False,indent=2))
Path('data/spatial/gbif-query.json').write_text(json.dumps(dict(queryUrl='https://api.gbif.org/v1/occurrence/search?decimalLongitude=112.90,113.02&decimalLatitude=28.10,28.27&hasCoordinate=true&hasGeospatialIssue=false&coordinateUncertaintyInMeters=0,1000&license=CC_BY_4_0&limit=100',retrievedAt=now,observedYears=sorted(set(int(f['properties']['observedAt'][:4]) for f in accepted)),matched=d['count'],fetched=len(d['results']),accepted=len(accepted),rejected=rejected,endOfRecords=d['endOfRecords'],rawSha256=hashlib.sha256(Path(sys.argv[2]).read_bytes()).hexdigest(),scope='Bounded pilot snapshot, not a full inventory; no observer names retained'),indent=2))
print('Water',len(rows),'GBIF',len(accepted),'of',d['count'])
