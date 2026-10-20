import {sanity, type SanityImage} from './sanity'

export interface Piece {
  _id: string
  title: string
  image: SanityImage
  url: string
  dimensions: {width: number; height: number}
  lqip?: string
  video?: string
  /** Set on the Portfolio page, so the viewer can link to the project the piece belongs to */
  project?: {title: string; slug: string}
}

export interface Cover {
  image: SanityImage
  lqip?: string
}

export interface ProjectSummary {
  _id: string
  title: string
  slug: string
  count: number
  cover: Cover | null
}

export interface Project extends ProjectSummary {
  description?: string
  pieces: Piece[]
}

export const pieceFields = `_id, title, image, "url": image.asset->url, "dimensions": image.asset->metadata.dimensions, "lqip": image.asset->metadata.lqip, "video": video.asset->url`

/** Projects in the order set on the Projects page, then any others A to Z */
export async function getProjects(): Promise<{intro?: string; projects: Project[]}> {
  const data = await sanity.fetch<{intro?: string; order?: string[]; projects: Project[]}>(`{
    "intro": *[_id == "projectsPage"][0].intro,
    "order": *[_id == "projectsPage"][0].order[]._ref,
    "projects": *[_type == "project" && defined(slug.current) && !(_id in path("drafts.**"))]{
      _id, title, "slug": slug.current, description,
      "pieces": pieces[defined(@->image.asset)]->{${pieceFields}},
      "cover": select(defined(cover.asset) => {"image": cover, "lqip": cover.asset->metadata.lqip})
    }
  }`)

  const order = data.order ?? []
  const rank = (p: Project) => {
    const i = order.indexOf(p._id)
    return i === -1 ? Infinity : i
  }
  const projects = data.projects
    .map((p) => {
      const pieces = (p.pieces ?? []).filter(Boolean)
      const first = pieces[0]
      return {...p, pieces, count: pieces.length, cover: p.cover ?? (first ? {image: first.image, lqip: first.lqip} : null)}
    })
    .filter((p) => p.pieces.length > 0)
    .sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title))

  return {intro: data.intro, projects}
}
