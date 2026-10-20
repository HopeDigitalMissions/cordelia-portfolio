import {sanity} from './sanity'
import {getProjects, pieceFields, type Piece} from './projects'

/**
 * Pieces switched on for the portfolio: the ones picked to show first, then project by project in
 * the Projects page order, then any others newest first. Each piece links to the first project it is in.
 */
export async function getPortfolio(): Promise<{intro?: string; pieces: Piece[]}> {
  const [{projects}, data] = await Promise.all([
    getProjects(),
    sanity.fetch<{intro?: string; first?: string[]; pieces: Piece[]}>(`{
      "intro": *[_id == "portfolioPage"][0].intro,
      "first": *[_id == "portfolioPage"][0].order[]._ref,
      "pieces": *[_type == "artwork" && showOnPortfolio == true && defined(image.asset) && !(_id in path("drafts.**"))]
        | order(_createdAt desc) {${pieceFields}}
    }`),
  ])

  const home = new Map<string, {title: string; slug: string}>()
  const rank = new Map<string, number>()
  for (const id of data.first ?? []) if (!rank.has(id)) rank.set(id, rank.size)
  for (const project of projects) {
    for (const piece of project.pieces) {
      if (!home.has(piece._id)) home.set(piece._id, {title: project.title, slug: project.slug})
      if (!rank.has(piece._id)) rank.set(piece._id, rank.size)
    }
  }

  const last = rank.size
  const pieces = data.pieces
    .map((piece) => ({...piece, project: home.get(piece._id)}))
    .sort((a, b) => (rank.get(a._id) ?? last) - (rank.get(b._id) ?? last))

  return {intro: data.intro, pieces}
}
