# 空间数据接口 V2（独立提案，等待团队审核）

本模块扩展现有六类图层的数据供应能力，未修改 `LayerId`、`MapObject`、OverlayState、相机或课程成果。`src/spatial-data/types.ts` 是新增供应接口，不能替换当前地图契约；合并前需负责人审核，三维开发者决定何时将这些描述符关联到现有可见性状态。

## HTTP /api/spatial-data（不需要数据库或Token）

```ts
const layers = await fetch('/api/spatial-data').then(r => r.json());
const area = await fetch('/api/spatial-data?action=study-area').then(r => r.json());
const region = await fetch('/api/spatial-data?action=region&bbox=112.92,28.11,112.95,28.15&layers=ecology.worldcover.2021,geography.roads.existing,ecology.gbif.snapshot').then(r => r.json());
const result = await fetch('/api/spatial-data?action=analysis&studyAreaId=yanghu&bufferMeters=100&layers=ecology.worldcover.2021,geography.roads.existing,ecology.gbif.snapshot').then(r => r.json());
```

- `action=layer&layerId=…&bbox=…`：元信息＋数据。栅格无bbox时只给描述；带bbox返回保留原格网的子窗口和分类值，不转Marker。GeoTIFF在dataUrl，可交给外部GIS。
- `action=object&layerId=…&id=…`：对象属性、几何和图层来源；GBIF对象ID如gbif-5012539410，带记录/数据集来源与许可。
- `action=region`：1–5层，必须有效bbox。向量采用包围盒相交候选查询，可能返回越界线/面；不是精确裁剪。分析另作多边形掩膜。WGS84 bbox顺序west,south,east,north；窗口边长≤0.5度。
- `action=analysis`：本阶段仅已审计yanghu，可选择组合与10–1000m邻近阈值，必须含WorldCover。返回参数、来源、证据、限制、verificationStatus与candidateResearchQuestion。
- 月报层geometryType=nonspatial，返回records，绝不生成虚假断面点。空间区域查询也不能暗示这些断面在bbox内，应单独展示“未定位资料”。

Layer描述有稳定ID、现有category、几何类型、来源、年份、官方图例、可见性控制归属、数据加载可用状态、范围、查询方法、质量说明。`visibility=controlled-by-existing-overlay` 不代表已开启；`loadStatus=available` 代表本地快照可读取，不是第二套UI加载状态。图层开关、选择、相机继续由现有单一状态负责。网络服务不在浏览器实时请求外部API。

## 函数 / 数据边界

- `catalog.ts`：小型来源和图层目录，可供类型与注册器审核。
- `service.ts`：仅服务端使用，白名单文件、Promise缓存失败可重试；不在React/Three.js中导入。提供listLayers/getLayer/loadLayer/objectDetails/regionLayers/studyArea。
- `geometry.ts`：纯函数contains（支持holes）、cropRaster、distanceToLine、pointBuffer（65点近似圆，单位m）。局部近似用于长沙短距离，非通用大地测量库。
- `analysis.ts`：原生像元中心落面＋道路距离阈值（隐式线缓冲）＋考虑记录误差的邻近分析；没有把线强转成点。道路包围盒预筛加速；不输出虚构的法定缓冲边界。

当前只实现固定研究面样板及区域数据查询，不宣称任意用户绘制面、通用时序变化、持久化Insight或完整三维集成已完成。新结果是待验证线索，可由研究UI通过evidenceReferences关联已有研究资料；禁止自动生成已证实Issue。

## 样板解释与复现

运行：`node --import tsx --input-type=module -e "import {analyzeYanghu} from './src/spatial-data/analysis.ts'; console.log(JSON.stringify(await analyzeYanghu(),null,2))"`。

固定数据结果 `data/spatial/yanghu-analysis.json`：55076个分类像元中心，nodata=0，27320个在已有道路100m邻近范围；57条GBIF样本在研究面内（实际只有1个唯一坐标，不代表57个独立地点）。其坐标误差可大于距离，结果标uncertain。约像元面积75.9m²，不直接把10m名义分辨率当100m²计算；按中心掩膜的面积仅近似。

研究线索：“道路邻近的不同土地覆盖地块如何被使用？应在何处核验路径可达性、生态边界与活动方式？”证据是分类像元、道路几何及误差信息；没有活动调查，不能得出活动破坏生态结论。水质未定位、步行网络不完整、GBIF采样偏倚、跨年方法不同均列为缺口。WorldCover2020/2021不做直接变化统计。

`yanghu-overlay.svg/png` 是独立平面数据叠加诊断，使用官方类别色、不用于改变产品配色；图层分组为worldcover/roads/study-area/gbif-uncertainty。同坐标观察点合并显示，虚线为位置误差。不是三维集成截图。
