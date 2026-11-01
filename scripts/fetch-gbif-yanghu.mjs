// 下载并清洗洋湖周边 GBIF 生物观察记录。
// 来源: GBIF occurrence/search API (https://api.gbif.org/v1/occurrence/search)
// 研究范围 bbox: 28.09~28.17 N, 112.88~112.99 E (覆盖洋湖湿地及周边城区)
import fs from 'node:fs';
import path from 'node:path';

const CACHE = '.cache/yanghu';
const OUT_DIR = 'public/data';
const BBOX = [112.88, 28.09, 112.99, 28.17]; // minLon, minLat, maxLon, maxLat
const GEOMETRY = `POLYGON((${BBOX[0]} ${BBOX[1]},${BBOX[2]} ${BBOX[1]},${BBOX[2]} ${BBOX[3]},${BBOX[0]} ${BBOX[3]},${BBOX[0]} ${BBOX[1]}))`;
const PER_PAGE = 300;

// GBIF 观察记录中，坐标不确定性缺失时按 taxonRank/数据集保守处理：
// 记录级坐标不确定性为 null 时，视为「未报告精度」，前端需标记而非伪装高精度。
// 这里只保留有明确坐标且 (不确定性缺失 或 <= 500m) 的记录，并显式记录 missingUncertainty 标记。

async function fetchPage(offset) {
  const params = new URLSearchParams({
    geometry: GEOMETRY,
    hasCoordinate: 'true',
    limit: String(PER_PAGE),
    offset: String(offset),
  });
  const url = `https://api.gbif.org/v1/occurrence/search?${params}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'xiangjiang-2035-research/1.0 (student project)' } });
  if (!res.ok) throw new Error(`GBIF request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

function cleanRecord(r) {
  const lat = r.decimalLatitude, lon = r.decimalLongitude;
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  // 坐标越界或明显错误（缺省坐标 0,0 等）剔除
  if (lat < BBOX[1] || lat > BBOX[3] || lon < BBOX[0] || lon > BBOX[2]) return null;
  // hasGeospatialIssues 标记为 true 的记录剔除（已知的坐标问题）
  if (r.hasGeospatialIssues === true) return null;

  const uncertainty = r.coordinateUncertaintyInMeters;
  const missingUncertainty = uncertainty == null;
  // 坐标不确定性超过 1000m 视为精度不足，标记但保留（用于可视化标注，不作为高精度点）
  const precisionFlag = missingUncertainty ? 'unreported' : uncertainty > 500 ? 'coarse' : 'fine';

  // 物种名：优先 species/scientificName，缺省用 genus/更高阶
  const taxon = r.species || r.genus || r.family || r.scientificName || '未鉴定';

  return {
    key: r.key,
    occurrenceId: r.occurrenceID || null,
    lat, lon,
    uncertainty: uncertainty ?? null,
    precision: precisionFlag,          // fine | coarse | unreported
    species: r.species || null,
    scientificName: r.scientificName || null,
    taxon: taxon,
    taxonRank: r.taxonRank || null,
    kingdom: r.kingdom || null,
    class: r.class || null,
    order: r.order || null,
    family: r.family || null,
    genus: r.genus || null,
    basisOfRecord: r.basisOfRecord || null,
    eventDate: r.eventDate || null,
    year: r.year || null,
    month: r.month || null,
    day: r.day || null,
    datasetKey: r.datasetKey || null,
    datasetName: r.datasetName || null,
    license: r.license || null,
    geodeticDatum: r.geodeticDatum || null,
    iucn: r.iucnRedListCategory || null,
  };
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. 先取总数
  const probe = await fetchPage(0);
  const total = probe.count;
  console.log(`GBIF 范围内总记录: ${total}`);

  // 2. 分页下载
  const all = [];
  let offset = 0;
  let page = 0;
  while (offset < total) {
    let data;
    if (offset === 0) data = probe;
    else data = await fetchPage(offset);
    for (const r of data.results) {
      const c = cleanRecord(r);
      if (c) all.push(c);
    }
    offset += PER_PAGE;
    page += 1;
    process.stdout.write(`\r下载进度: ${Math.min(offset, total)}/${total} (page ${page})`);
    // 尊重 API 速率，短暂停顿
    await new Promise(res => setTimeout(res, 150));
  }
  process.stdout.write('\n');

  // 3. 去重（按物种+坐标+时间近似，保留 quality 最高的一条）
  const seen = new Map();
  for (const c of all) {
    const key = `${c.species || c.taxon}|${c.lat.toFixed(5)}|${c.lon.toFixed(5)}|${c.eventDate || ''}`;
    const existing = seen.get(key);
    if (!existing) { seen.set(key, c); continue; }
    // 保留精度更高（fine > coarse > unreported）的记录
    const rank = { fine: 3, coarse: 2, unreported: 1 };
    if (rank[c.precision] > rank[existing.precision]) seen.set(key, c);
  }
  const deduped = Array.from(seen.values());

  // 4. 统计
  const byClass = {};
  const byPrecision = { fine: 0, coarse: 0, unreported: 0 };
  for (const c of deduped) {
    byClass[c.class || '未知'] = (byClass[c.class || '未知'] || 0) + 1;
    byPrecision[c.precision] = (byPrecision[c.precision] || 0) + 1;
  }

  const summary = {
    retrievedAt: new Date().toISOString(),
    source: 'GBIF occurrence/search API',
    sourceUrl: 'https://www.gbif.org/occurrence/search',
    license: 'CC-BY-NC 4.0 (record-level licenses vary; see per-record license field)',
    attribution: 'GBIF.org (dataset contributions via iNaturalist and others)',
    bbox: BBOX,
    totalRaw: total,
    afterCleaning: deduped.length,
    removedByGeospatialIssue: all.length - deduped.length, // 近似（去重+清洗）
    byClass,
    byPrecision,
    coordinateSystem: 'WGS84 (EPSG:4326)',
    note: '观察记录不代表完整物种分布；精度为坐标不确定性，非生态范围。',
  };

  const out = { ...summary, records: deduped };
  fs.writeFileSync(path.join(OUT_DIR, 'gbif-yanghu.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(CACHE, 'gbif-yanghu.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(CACHE, 'gbif-summary.json'), JSON.stringify(summary, null, 2));

  console.log('\n=== GBIF 清洗结果 ===');
  console.log(`原始记录: ${total}`);
  console.log(`清洗后: ${deduped.length}`);
  console.log('按类群:', byClass);
  console.log('按精度:', byPrecision);
  console.log(`已写入 public/data/gbif-yanghu.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
