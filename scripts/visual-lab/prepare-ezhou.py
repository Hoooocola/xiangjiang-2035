"""Extract the submitted owner's island surface; never modify source files.
Usage: python3 prepare-ezhou.py <original-model-folder> <intermediate-folder>
Metadata must be EPSG:32649 with a source origin. The output uses the project's
100m scene units. Affine UTM/local-tangent approximation is documented, not survey registration.
"""
import sys,os,json,math,array,xml.etree.ElementTree as ET,collections
root,out=sys.argv[1:3];os.makedirs(out,exist_ok=True)
meta=ET.parse(os.path.join(root,'metadata.xml')).getroot();assert meta.findtext('SRS')=='EPSG:32649';origin=list(map(float,meta.findtext('SRSOrigin').split(',')))
def inverse(E,N):
 a=6378137.;e=.0066943799901413165;k=.9996;ep=e/(1-e);x=E-500000;y=N;M=y/k;mu=M/(a*(1-e/4-3*e*e/64-5*e**3/256));e1=(1-math.sqrt(1-e))/(1+math.sqrt(1-e));fp=mu+(3*e1/2-27*e1**3/32)*math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*math.sin(4*mu)+(151*e1**3/96)*math.sin(6*mu)+(1097*e1**4/512)*math.sin(8*mu);C=ep*math.cos(fp)**2;T=math.tan(fp)**2;R=a*(1-e)/(1-e*math.sin(fp)**2)**1.5;n=a/math.sqrt(1-e*math.sin(fp)**2);D=x/(n*k);lat=fp-n*math.tan(fp)/R*(D*D/2-(5+3*T+10*C-4*C*C-9*ep)*D**4/24+(61+90*T+298*C+45*T*T-252*ep-3*C*C)*D**6/720);lon=((D-(1+2*T+C)*D**3/6+(5-2*C+28*T-3*C*C+8*ep+24*T*T)*D**5/120)/math.cos(fp))*180/math.pi+111;return lon,lat*180/math.pi
lon,lat=inverse(*origin[:2]);cos=math.cos(math.radians(28.195))
def project(c):return((c[0]-112.965)*111320*cos/100,-(c[1]-28.195)*111320/100)
o=project((lon,lat));ex=project(inverse(origin[0]+100,origin[1]));ny=project(inverse(origin[0],origin[1]+100));A=((ex[0]-o[0])/100,(ny[0]-o[0])/100,(ex[1]-o[1])/100,(ny[1]-o[1])/100)
asset=json.load(open('public/data/research/ezhou.json'));ring=[project(p)for p in asset['boundary']];bbox=[min(p[0]for p in ring),min(p[1]for p in ring),max(p[0]for p in ring),max(p[1]for p in ring)]
def inside(x,z):
 if not bbox[0]<=x<=bbox[2]or not bbox[1]<=z<=bbox[3]:return False
 hit=False;j=len(ring)-1
 for i,(xi,zi)in enumerate(ring):
  xj,zj=ring[j]
  if (zi>z)!=(zj>z)and x<(xj-xi)*(z-zi)/(zj-zi)+xi:hit=not hit
  j=i
 return hit
report={'sourceState':'USER ORIGINAL / metadata supplied','crs':'EPSG:32649','origin':origin,'sourceOriginWgs84':[lon,lat],'worldOrigin':o,'affine':A,'groups':[],'sourceTriangles':0,'retainedTriangles':0}
for block in sorted(os.listdir(root)):
 path=os.path.join(root,block,block+'.obj')
 if not os.path.isfile(path):continue
 v=array.array('f');uv=array.array('f');groups={};material='0';counts=collections.Counter();tex={};name=None
 for l in open(os.path.join(root,block,block+'.mtl')):
  if l.startswith('newmtl '):name=l.split()[1]
  elif l.startswith('map_Kd '):tex[name]=os.path.join(root,block,l.split(None,1)[1].strip())
 for l in open(path):
  if l.startswith('v '):
   x,y,z=map(float,l.split()[1:4]);v.extend((o[0]+A[0]*x+A[1]*y,(z+origin[2]-42)/100,o[1]+A[2]*x+A[3]*y))
  elif l.startswith('vt '):uv.extend(map(float,l.split()[1:3]))
  elif l.startswith('usemtl '):material=l.split()[1]
  elif l.startswith('f '):
   parts=l.split()[1:];report['sourceTriangles']+=len(parts)-2
   for j in range(1,len(parts)-1):
    f=[parts[0].split('/'),parts[j].split('/'),parts[j+1].split('/')];ix=[int(p[0])-1 for p in f];x=sum(v[i*3]for i in ix)/3;z=sum(v[i*3+2]for i in ix)/3
    if not inside(x,z):continue
    a=groups.setdefault(material,array.array('I'))
    for p,i in zip(f,ix):a.extend((i,int(p[1])-1))
 for material,faces in groups.items():
  positions=array.array('f');coords=array.array('f');indices=array.array('I');index={}
  for i in range(0,len(faces),2):
   vi,ti=faces[i],faces[i+1];key=(vi,ti)
   if key not in index:index[key]=len(index);positions.extend(v[vi*3:vi*3+3]);coords.extend(uv[ti*2:ti*2+2])
   indices.append(index[key])
  key=block+'-'+material
  for ext,data in [('pos',positions),('uv',coords),('idx',indices)]:data.tofile(open(os.path.join(out,key+'.'+ext),'wb'))
  report['retainedTriangles']+=len(indices)//3;report['groups'].append({'id':key,'texture':tex[material],'vertices':len(index),'triangles':len(indices)//3});print(key,len(indices)//3,flush=True)
json.dump(report,open(os.path.join(out,'manifest.json'),'w'),indent=2);print('TOTAL',report['sourceTriangles'],report['retainedTriangles'])
