export type SceneDetail = 'course' | 'object' | 'place' | null;
/** One right-hand detail surface; independent from the set of visible map layers. */
export function activeSceneDetail(state: {
  detailOpen: boolean; objectId?: string | null; courseWorkId?: string | null;
  atlasPanel: 'layers' | 'library' | null; drawer: string | null;
}): SceneDetail {
  if (state.drawer || state.atlasPanel === 'library') return null;
  if (state.detailOpen) return state.atlasPanel ? null : 'place';
  if (state.objectId) return 'object';
  if (state.courseWorkId && !state.atlasPanel) return 'course';
  return null;
}
