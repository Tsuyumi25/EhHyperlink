import { cosplayerTags } from './searchPlan'
import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { normalizeMarkerText } from '../title/titleMarkers'

/** The complete title fields as written, folded for comparison; empty fields drop out. */
function fullTitles(gallery: { title: string; titleJpn: string }): string[] {
  return [gallery.title, gallery.titleJpn].map(normalizeMarkerText).filter(Boolean)
}

/** 同名排除保留完整標題；抽掉作者、情境或卷數會把不同作品一起排除。 */
export function selectDiscoveries(source: SourceGallery, hits: readonly SearchHit[]): SearchHit[] {
  const isCosplayerSource = cosplayerTags(source.tags).length > 0
  const sourceTitles = new Set(isCosplayerSource ? fullTitles(source) : [])
  const seen = new Set<number>([source.gid])
  const selected: SearchHit[] = []
  for (const hit of hits) {
    if (seen.has(hit.gid)) continue
    seen.add(hit.gid)
    if (isCosplayerSource) {
      if (fullTitles(hit).some((title) => sourceTitles.has(title))) continue
    }
    selected.push(hit)
  }
  return selected
}
