import {getSite, sanity, urlFor, type SanityImage, type Site} from './sanity'

export const SITE_URL = 'https://www.thatartsyunicorn.com'

export interface ContactPiece {
  title: string
  image: SanityImage
  dimensions: {width: number; height: number}
  lqip?: string
  project?: {title: string; slug: string}
}

export interface ContactCard {
  name: string
  jobTitle: string
  event?: string
  note?: string
  email?: string
  photo?: SanityImage
  socials: Site['socials']
  pieces: ContactPiece[]
}

// The phone number is left out here on purpose: the page is built ahead of time,
// so only the card route (which checks the expiry on every request) reads it
const cardFields = `jobTitle, event, note, "photo": select(defined(photo.asset) => photo),
  "pieces": pieces[defined(@->image.asset)]->{title, image,
    "dimensions": image.asset->metadata.dimensions, "lqip": image.asset->metadata.lqip,
    "project": *[_type == "project" && defined(slug.current) && references(^._id) && !(_id in path("drafts.**"))][0]{title, "slug": slug.current}}`

export async function getContactCard(): Promise<ContactCard> {
  const [site, card] = await Promise.all([
    getSite(),
    sanity.fetch<Partial<ContactCard> | null>(`{
      ...*[_id == "contactCard"][0]{${cardFields}},
      "email": *[_id == "aboutPage"][0].email
    }`),
  ])
  return {
    name: site.name,
    jobTitle: card?.jobTitle || site.eyebrow,
    event: card?.event?.trim() || undefined,
    note: card?.note?.trim() || undefined,
    email: card?.email || undefined,
    photo: card?.photo ?? undefined,
    socials: site.socials,
    pieces: card?.pieces ?? [],
  }
}

/** The phone number, but only while "Share phone number until" is still ahead */
export async function getSharedPhone(now = Date.now()) {
  const phone = await sanity.fetch<{phone?: string; phoneUntil?: string} | null>(
    `*[_id == "contactCard"][0]{phone, phoneUntil}`,
  )
  if (!phone?.phone || !phone.phoneUntil || Date.parse(phone.phoneUntil) <= now) return undefined
  return phone.phone
}

/** Square crop for the photo, framed by the crop set in the Studio */
export const photoUrl = (photo: SanityImage, size: number) =>
  urlFor(photo).width(size).height(size).fit('crop')

export const firstName = (name: string) => name.trim().split(/\s+/)[0]

/** Opens their mail app addressed to her, with the event in the subject so replies are easy to find */
export function mailtoHref(card: ContactCard) {
  const params = [
    card.event && `subject=${encodeURIComponent(`We met at ${card.event}`)}`,
    `body=${encodeURIComponent(`Hi ${firstName(card.name)},\n\n`)}`,
  ].filter(Boolean)
  return `mailto:${card.email}?${params.join('&')}`
}

const socialLabels: Record<keyof Site['socials'], string> = {
  instagram: 'Instagram',
  cara: 'Cara',
  linkedin: 'LinkedIn',
  artstation: 'ArtStation',
}

// vCard 3.0 is the version both iPhone and Android contacts import
const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`)

/** US numbers get a +1 so they dial from anywhere; anything with its own + is kept */
function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (phone.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return phone.trim()
}

/** Long lines are folded at 75 bytes, continuing on lines that start with a space */
function fold(line: string) {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > 75) {
      parts.push(current)
      current = ' '
      bytes = 1
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n')
}

export function buildVCard(card: ContactCard, {phone, photo}: {phone?: string; photo?: string}) {
  const words = card.name.trim().split(/\s+/)
  const family = words.length > 1 ? words.pop()! : ''
  const given = words.join(' ')
  const metAt = card.event && `Met at ${card.event}`

  const urls: [string, string][] = [
    ['Website', SITE_URL],
    ...(Object.keys(socialLabels) as (keyof Site['socials'])[])
      .filter((key) => card.socials[key])
      .map((key): [string, string] => [socialLabels[key], card.socials[key]!]),
  ]

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeText(family)};${escapeText(given)};;;`,
    `FN:${escapeText(card.name)}`,
    metAt && `ORG:${escapeText(metAt)}`,
    card.jobTitle && `TITLE:${escapeText(card.jobTitle)}`,
    phone && `TEL;TYPE=CELL:${formatPhone(phone)}`,
    card.email && `EMAIL;TYPE=INTERNET:${card.email}`,
    // iPhone shows each link under its label; Android lists them as websites
    ...urls.flatMap(([label, url], i) => [`item${i + 1}.URL:${url}`, `item${i + 1}.X-ABLabel:${label}`]),
    (metAt || card.note) && `NOTE:${escapeText([metAt, card.note].filter(Boolean).join('\n'))}`,
    photo && `PHOTO;ENCODING=b;TYPE=JPEG:${photo}`,
    'END:VCARD',
  ]
  return lines.filter(Boolean).map((line) => fold(line as string)).join('\r\n') + '\r\n'
}
