/** Reject incomplete ways/relations before osmtogeojson can silently close them. */
export function completeOsm(id, elements, visiting = new Set()) {
 const element = elements.get(id);
 if (!element || visiting.has(id)) return false;
 if (element.type === 'node') return true;
 const next = new Set(visiting); next.add(id);
 if (element.type === 'way') return element.nodes.length >= 4 && element.nodes[0] === element.nodes.at(-1) && element.nodes.every(node => elements.has(`node/${node}`));
 return element.members.filter(member => ['outer','inner',''].includes(member.role)).every(member => {
  const part = elements.get(`${member.type}/${member.ref}`);
  // Relation boundaries may consist of open member ways joined by the converter.
  if (part?.type === 'way') return part.nodes.every(node => elements.has(`node/${node}`));
  return completeOsm(`${member.type}/${member.ref}`, elements, next);
 });
}
