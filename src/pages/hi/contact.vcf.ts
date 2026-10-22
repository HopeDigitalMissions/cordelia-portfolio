import type {APIRoute} from 'astro'
import {buildVCard, getContactCard, getSharedPhone, photoUrl} from '../../lib/contact'

// Runs on every tap instead of at build time, so the phone number drops out
// the moment "Share phone number until" passes, without waiting for a rebuild
export const prerender = false

async function photoBase64(card: Awaited<ReturnType<typeof getContactCard>>) {
  if (!card.photo) return undefined
  try {
    // Contacts apps want a small JPEG; a cut-out gets a white background
    const response = await fetch(photoUrl(card.photo, 400).bg('ffffff').format('jpg').quality(82).url())
    if (!response.ok) return undefined
    return Buffer.from(await response.arrayBuffer()).toString('base64')
  } catch {
    return undefined
  }
}

export const GET: APIRoute = async () => {
  const [card, phone] = await Promise.all([getContactCard(), getSharedPhone()])
  const body = buildVCard(card, {phone, photo: await photoBase64(card)})

  return new Response(body, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      // Inline lets iPhone show the card with Create New Contact; Android saves it as a file to open
      'Content-Disposition': `inline; filename="${card.name.replace(/[^\w ]/g, '')}.vcf"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
