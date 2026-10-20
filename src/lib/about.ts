import {sanity, type SanityImage} from './sanity'

interface Span {
  _type: 'span'
  text: string
  marks?: string[]
}

export interface Block {
  _type: string
  children?: Span[]
  markDefs?: {_key: string; _type: string; href?: string}[]
}

export interface About {
  photo?: SanityImage & {
    archBottom?: number
    dimensions: {width: number; height: number}
    isOpaque?: boolean
    lqip?: string
  }
  bio?: Block[]
  workTitle?: string
  work?: {_key: string; title: string; note?: string; role?: string}[]
  contactTitle?: string
  contact?: Block[]
  email?: string
  resume?: string
}

export async function getAbout(): Promise<About> {
  const about = await sanity.fetch<About | null>(`*[_id == "aboutPage"][0]{
    "photo": photo{
      alt, archBottom, asset, hotspot, crop,
      "dimensions": asset->metadata.dimensions,
      "isOpaque": asset->metadata.isOpaque,
      "lqip": asset->metadata.lqip
    },
    bio, workTitle, work, contactTitle, contact, email,
    "resume": resume.asset->url
  }`)
  const photo = about?.photo?.asset ? about.photo : undefined
  return {...about, photo}
}

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]!)

/** Paragraphs from the Studio as HTML: bold, italic and links */
export function toHtml(blocks: Block[] = []) {
  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => {
      const html = (block.children ?? [])
        .map((span) =>
          (span.marks ?? []).reduce((inner, mark) => {
            if (mark === 'strong' || mark === 'em') return `<${mark}>${inner}</${mark}>`
            const href = block.markDefs?.find((def) => def._key === mark)?.href
            if (!href) return inner
            const external = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''
            return `<a href="${escape(href)}"${external}>${inner}</a>`
          }, escape(span.text).replace(/\n/g, '<br>')),
        )
        .join('')
      return `<p>${html}</p>`
    })
    .join('')
}

export const toPlainText = (block?: Block) => (block?.children ?? []).map((span) => span.text).join('')
