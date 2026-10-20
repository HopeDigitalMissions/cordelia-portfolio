import {createClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'

export const sanity = createClient({
  projectId: 'ke2xjwml',
  dataset: 'production',
  apiVersion: '2025-08-15',
  useCdn: false,
})

const builder = createImageUrlBuilder(sanity)

export const urlFor = (source: Parameters<typeof builder.image>[0]) => builder.image(source)

export interface SanityImage {
  alt?: string
  asset: {_ref: string}
  hotspot?: {x: number; y: number}
  crop?: {top: number; bottom: number; left: number; right: number}
}

export interface Site {
  name: string
  eyebrow: string
  socials: {instagram?: string; cara?: string; linkedin?: string; artstation?: string}
}

export async function getSite(): Promise<Site> {
  const site = await sanity.fetch<Partial<Site> | null>(`*[_id == "landingPage"][0]{name, eyebrow, socials}`)
  return {
    name: site?.name ?? 'Cordelia Moore',
    eyebrow: site?.eyebrow ?? 'Illustrator & Concept Artist',
    socials: site?.socials ?? {},
  }
}

/** CSS position for the image's hotspot, adjusted for any crop */
export function hotspotPosition(image: SanityImage) {
  const crop = image.crop ?? {top: 0, bottom: 0, left: 0, right: 0}
  const hotspot = image.hotspot ?? {x: 0.5, y: 0.5}
  const clamp = (n: number) => Math.min(Math.max(n, 0), 1)
  const x = clamp((hotspot.x - crop.left) / (1 - crop.left - crop.right))
  const y = clamp((hotspot.y - crop.top) / (1 - crop.top - crop.bottom))
  return `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`
}
