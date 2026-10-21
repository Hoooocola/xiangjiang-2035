/** WGS84 local tangent approximation, origin Orange Isle. One scene unit = 100m.
 * EPSG:4490 must be transformed/validated upstream, never silently relabelled. */
export type Coordinate = [number, number];
export const ORIGIN: Coordinate = [112.965, 28.195];
export const METERS_PER_UNIT = 100;
export function project([lon, lat]: Coordinate): [number, number] {
  return [(lon - ORIGIN[0]) * 111320 * Math.cos(ORIGIN[1] * Math.PI / 180) / METERS_PER_UNIT,
    -(lat - ORIGIN[1]) * 111320 / METERS_PER_UNIT];
}
export function unproject([x, z]: [number, number]): Coordinate {
  return [ORIGIN[0] + x * METERS_PER_UNIT / (111320 * Math.cos(ORIGIN[1] * Math.PI / 180)), ORIGIN[1] - z * METERS_PER_UNIT / 111320];
}
export interface Feature {
  type: 'Feature'; id: string; properties: Record<string,string>;
  geometry: { type: 'Polygon'; coordinates: Coordinate[][] } | { type: 'MultiPolygon'; coordinates: Coordinate[][][] } | { type: 'LineString'; coordinates: Coordinate[] };
}
export interface SceneData { type: 'FeatureCollection'; features: Feature[] }
export function polygons(f: Feature): Coordinate[][][] {
  return f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
}
export function inRing(x: number,z: number, ring: [number,number][]) {
  let inside = false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,zi]=ring[i], [xj,zj]=ring[j];
    if(((zi>z)!==(zj>z)) && x<(xj-xi)*(z-zi)/(zj-zi)+xi) inside=!inside;
  }
  return inside;
}
