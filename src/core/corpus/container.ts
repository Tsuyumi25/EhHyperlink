import { matchContainers, matchExtractedChapters } from '../search/container'
import { planSearch } from '../search/searchPlan'
import { defineCase } from './check'
import { gallery, type GalleryInput } from './gallery'
import { hit, type HitInput } from './matching'

type ContainerInput = { source: GalleryInput; hits: HitInput[] }

export const containers = defineCase('來源刊物', ({ source, hits }: ContainerInput) => {
  const plan = planSearch(gallery(source))
  return matchContainers(plan.containerNames, hits.map(hit)).map((candidate) => candidate.gid)
})

export const chapters = defineCase('收錄章節', ({ source, hits }: ContainerInput) => {
  const current = gallery(source)
  if (!planSearch(current).isContainerCandidate) return []
  return matchExtractedChapters(current, hits.map(hit)).map((candidate) => candidate.gid)
})
