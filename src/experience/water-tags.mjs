/** OSM permanent surface-water tags; wetlands alone are not open water. */
export function isSurfaceWater(properties) {
 return properties.natural === 'water' || properties.waterway === 'riverbank' ||
  ['river','lake','pond','reservoir','basin','canal','lagoon','oxbow','moat','stream'].includes(properties.water);
}
export function isRiverWater(properties) {
 return properties.water === 'river' || properties.waterway === 'riverbank';
}
