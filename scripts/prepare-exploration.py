"""Lossless WorldCover upload artifact; stdlib only, no resampling or remote fetch."""
from pathlib import Path
import struct,json,zlib,hashlib,collections
root=Path(__file__).resolve().parents[1];p=root/'public/data/spatial';b=(p/'worldcover-2021-core.tif').read_bytes();e='<'if b[:2]==b'II'else'>';o=struct.unpack_from(e+'I',b,4)[0];tags={}
for i in range(struct.unpack_from(e+'H',b,o)[0]):
 pos=o+2+i*12;tag,t,c,v=struct.unpack_from(e+'HHII',b,pos);size={1:1,2:1,3:2,4:4,12:8}.get(t)
 if size and t in[1,3,4,12]:tags[tag]=struct.unpack_from(e+{1:'B',3:'H',4:'I',12:'d'}[t]*c,b,pos+8 if size*c<=4 else v)
w,h=tags[256][0],tags[257][0];tw,th=tags[322][0],tags[323][0];assert tags[258]==(8,) and tags[259]==(8,) and tags[317]==(1,)
values=bytearray(w*h);cols=(w+tw-1)//tw
for tile,(offset,size)in enumerate(zip(tags[324],tags[325])):
 raw=zlib.decompress(b[offset:offset+size]);x,y=(tile%cols)*tw,(tile//cols)*th
 for r in range(min(th,h-y)):
  n=min(tw,w-x);values[(y+r)*w+x:(y+r)*w+x+n]=raw[r*tw:r*tw+n]
d=json.loads((p/'worldcover-2021-core.json').read_text());assert values==bytes(d['values'])
source=json.loads((root/'data/spatial/worldcover-source.json').read_text());assert hashlib.sha256(b).hexdigest()==source['sha256']
(p/'worldcover-2021-core.bin').write_bytes(values)
meta={k:d[k]for k in ['width','height','bounds','nodata']};meta.update(rowOrder='north-to-south',columnOrder='west-to-east',crs='EPSG:4326',pixelSpacing=list(tags[33550][:2]),pixelOrigin=list(tags[33922][3:5]),pixelInterpretation='pixel-is-area; read at centre',source=source,byteLength=len(values),sha256=hashlib.sha256(values).hexdigest(),classes=sorted(collections.Counter(values)),counts=dict(collections.Counter(values)),verification='All decoded TIFF pixels equal existing JSON; lossless R8, nearest sampling; no resampling')
(p/'worldcover-2021-texture.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');print({k:meta[k]for k in['width','height','byteLength','classes','sha256']})
