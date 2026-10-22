import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient, type SanityClient} from 'sanity'
import {Badge, Box, Button, Card, Checkbox, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {createImageUrlBuilder} from '@sanity/image-url'

interface Piece {
  _id: string
  /** The published copy and any unpublished draft, so both stay in step */
  copies: string[]
  title: string
  image?: string
  video: boolean
  on: boolean
}

interface Group {
  key: string
  title: string
  ids: string[]
}

interface Data {
  art: {_id: string; title?: string; image?: string; video: boolean; on?: boolean}[]
  projects: {_id: string; title?: string; pieces?: string[]}[]
  order?: string[]
}

type Show = 'all' | 'on' | 'off'

const query = (flag: string) => `{
  "art": *[_type == "artwork" && !(_id in path("versions.**"))]{
    _id, title, "image": image.asset._ref, "video": defined(video.asset), "on": ${flag}
  },
  "projects": *[_type == "project" && !(_id in path("drafts.**"))]{_id, title, "pieces": pieces[]._ref},
  "order": *[_id == "projectsPage"][0].order[]._ref
}`

export interface PickerConfig {
  /** The artwork switch this picker sets */
  flag: 'showOnPortfolio' | 'showOnLanding'
  /** Where the pieces go, as in "On the portfolio" */
  place: string
  intro: string
  /**
   * Runs once she pauses or leaves, after a run of clicks. It changes the page document, which is
   * what rebuilds the site; the clicks themselves are stamped so they don't each start a build.
   */
  settle: (client: SanityClient) => Promise<unknown>
}

/**
 * Every artwork as a grid of thumbnails, grouped by project, with a checkbox on each so she can
 * put lots of pieces on a page (or take them off) without opening them one by one.
 * Each click saves straight to the published piece.
 */
function PiecePicker({flag, place, intro, settle}: PickerConfig) {
  const client = useClient({apiVersion: '2025-08-15'})
  const toast = useToast()
  const [pieces, setPieces] = useState<Map<string, Piece> | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [show, setShow] = useState<Show>('all')
  const saving = useRef(0)
  const stale = useRef(false)
  const announcing = useRef<ReturnType<typeof setTimeout> | null>(null)

  const thumb = useMemo(() => {
    const builder = createImageUrlBuilder(client)
    // Size by the longer side only, so the whole piece shows rather than a square crop
    return (ref: string) => {
      const [, width, height] = /-(\d+)x(\d+)-/.exec(ref)?.map(Number) ?? [0, 1, 1]
      const image = builder.image(ref).fit('max').auto('format')
      return (width >= height ? image.width(360) : image.height(360)).url()
    }
  }, [client])

  const load = useCallback(async () => {
    const data = await client.fetch<Data>(query(flag), {}, {perspective: 'raw'})
    const next = new Map<string, Piece>()
    // Published copies first, so the switch shows what the site uses; a draft adds its id and newer title
    const sorted = [...data.art].sort((a, b) => Number(a._id.startsWith('drafts.')) - Number(b._id.startsWith('drafts.')))
    for (const doc of sorted) {
      const id = doc._id.replace(/^drafts\./, '')
      const known = next.get(id)
      if (known) {
        known.copies.push(doc._id)
        known.title = doc.title ?? known.title
        known.image = doc.image ?? known.image
        continue
      }
      next.set(id, {
        _id: id,
        copies: [doc._id],
        title: doc.title ?? 'Untitled',
        image: doc.image,
        video: doc.video,
        on: doc.on === true,
      })
    }

    // Projects in the same order as the Projects page, then the rest A to Z
    const order = data.order ?? []
    const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : Infinity)
    const projects = [...data.projects].sort(
      (a, b) => rank(a._id) - rank(b._id) || (a.title ?? '').localeCompare(b.title ?? ''),
    )
    const placed = new Set<string>()
    const nextGroups: Group[] = []
    for (const project of projects) {
      const ids = [...new Set(project.pieces ?? [])].filter((id) => next.has(id))
      if (!ids.length) continue
      ids.forEach((id) => placed.add(id))
      nextGroups.push({key: project._id, title: project.title ?? 'Untitled project', ids})
    }
    const loose = [...next.keys()].filter((id) => !placed.has(id))
    if (loose.length) nextGroups.push({key: 'loose', title: 'Not in a project', ids: loose})

    setPieces(next)
    setGroups(nextGroups)
  }, [client, flag])

  useEffect(() => {
    load().catch((err) => toast.push({status: 'error', title: 'Could not load the artwork', description: err.message}))
    // Pick up changes made elsewhere, once any saves from here have landed
    let timer: ReturnType<typeof setTimeout>
    const subscription = client
      .listen('*[_type in ["artwork", "project", "projectsPage"]]', {}, {includeResult: false, visibility: 'query'})
      .subscribe(() => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (saving.current) stale.current = true
          else load().catch(() => {})
        }, 400)
      })
    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [client, load, toast])

  // The site rebuilds when the page document changes, not when a piece is switched from here
  // (see portfolioPickedAt), so a run of clicks ends in a single rebuild once she pauses or leaves
  const announce = useCallback(() => {
    if (announcing.current) clearTimeout(announcing.current)
    announcing.current = null
    settle(client).catch((err) =>
      toast.push({status: 'error', title: 'Could not tell the site to update', description: err.message}),
    )
  }, [client, settle, toast])

  useEffect(() => {
    const flush = () => {
      if (announcing.current) announce()
    }
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [announce])

  const setOn = useCallback(
    async (ids: string[], on: boolean) => {
      if (!pieces) return
      const changing = ids.map((id) => pieces.get(id)).filter((p): p is Piece => !!p && p.on !== on)
      if (!changing.length) return

      const flip = (value: boolean) =>
        setPieces((current) => {
          const next = new Map(current)
          for (const piece of changing) next.set(piece._id, {...next.get(piece._id)!, on: value})
          return next
        })

      flip(on)
      saving.current++
      const transaction = client.transaction()
      const pickedAt = new Date().toISOString()
      for (const piece of changing) {
        for (const id of piece.copies) transaction.patch(id, {set: {[flag]: on, portfolioPickedAt: pickedAt}})
      }
      try {
        await transaction.commit({visibility: 'async'})
        if (announcing.current) clearTimeout(announcing.current)
        announcing.current = setTimeout(announce, 15000)
      } catch (err) {
        flip(!on)
        toast.push({status: 'error', title: 'Could not save that change', description: (err as Error).message})
      } finally {
        saving.current--
        if (!saving.current && stale.current) {
          stale.current = false
          load().catch(() => {})
        }
      }
    },
    [announce, client, flag, load, pieces, toast],
  )

  if (!pieces) {
    return (
      <Flex align="center" justify="center" padding={5}>
        <Spinner muted />
      </Flex>
    )
  }

  const all = [...pieces.values()]
  const onCount = all.filter((p) => p.on).length
  const visible = (piece: Piece) => show === 'all' || (show === 'on') === piece.on

  return (
    <Box padding={4}>
      <Stack gap={5}>
        <Stack gap={4}>
          <Text size={1} muted>
            {intro}
          </Text>
          <Flex gap={2} wrap="wrap">
            <Button
              mode={show === 'all' ? 'default' : 'ghost'}
              text={`All artwork (${all.length})`}
              onClick={() => setShow('all')}
            />
            <Button
              mode={show === 'on' ? 'default' : 'ghost'}
              text={`${place} (${onCount})`}
              onClick={() => setShow('on')}
            />
            <Button
              mode={show === 'off' ? 'default' : 'ghost'}
              text={`Not on it (${all.length - onCount})`}
              onClick={() => setShow('off')}
            />
          </Flex>
        </Stack>

        {groups.map((group) => {
          const members = group.ids.map((id) => pieces.get(id)!)
          const shown = members.filter(visible)
          if (!shown.length) return null
          const groupOn = members.filter((p) => p.on).length
          return (
            <Stack key={group.key} gap={3}>
              <Flex align="center" gap={3} wrap="wrap">
                <Stack flex={1} gap={2}>
                  <Heading size={1}>{group.title}</Heading>
                  <Text size={1} muted>
                    {groupOn} of {members.length} {place.toLowerCase()}
                  </Text>
                </Stack>
                <Button
                  mode="ghost"
                  text="Add all"
                  disabled={groupOn === members.length}
                  onClick={() => setOn(group.ids, true)}
                />
                <Button
                  mode="ghost"
                  tone="critical"
                  text="Remove all"
                  disabled={groupOn === 0}
                  onClick={() => setOn(group.ids, false)}
                />
              </Flex>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12}}>
                {shown.map((piece) => (
                  <Tile key={piece._id} piece={piece} src={piece.image && thumb(piece.image)} onToggle={setOn} />
                ))}
              </div>
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
}

function Tile({piece, src, onToggle}: {piece: Piece; src?: string; onToggle: (ids: string[], on: boolean) => void}) {
  return (
    <Card
      as="label"
      radius={2}
      border
      tone={piece.on ? 'primary' : 'default'}
      title={piece.title}
      style={{
        display: 'block',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: piece.on ? '0 0 0 2px var(--card-focus-ring-color)' : undefined,
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '1',
          background: 'rgba(128, 128, 128, 0.12)',
        }}
      >
        {src && (
          <img
            src={src}
            alt=""
            loading="lazy"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              padding: 6,
              boxSizing: 'border-box',
              objectFit: 'contain',
              opacity: piece.on ? 1 : 0.4,
              transition: 'opacity 150ms',
            }}
          />
        )}
        {piece.video && (
          <Box style={{position: 'absolute', top: 6, right: 6}}>
            <Badge>Video</Badge>
          </Box>
        )}
      </div>
      <Flex align="center" gap={2} padding={2}>
        <Checkbox checked={piece.on} onChange={() => onToggle([piece._id], !piece.on)} />
        <Box flex={1} style={{minWidth: 0}}>
          <Text size={1} textOverflow="ellipsis">
            {piece.title}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}

export function PortfolioPicker() {
  return (
    <PiecePicker
      flag="showOnPortfolio"
      place="On the portfolio"
      intro="Click a piece to put it on the Portfolio page or take it off. Each click saves right away, and the site updates a few minutes after you finish. To choose which pieces lead the page, use the Order and intro tab."
      settle={(client) =>
        client
          .transaction()
          .createIfNotExists({_id: 'portfolioPage', _type: 'portfolioPage'})
          .patch('portfolioPage', {set: {piecesChangedAt: new Date().toISOString()}})
          .commit({visibility: 'async'})
      }
    />
  )
}

/** Keeps the landing slideshow order in step with the switched-on pieces */
export async function syncLandingSlides(client: SanityClient) {
  const {on, slides} = await client.fetch<{on: string[]; slides: string[] | null}>(
    `{
      "on": *[_type == "artwork" && showOnLanding == true && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_createdAt desc)._id,
      "slides": *[_id == "landingPage"][0].slides[]._ref
    }`,
  )
  const next = slideOrder(slides ?? [], on)
  if (!next) return
  const value = next.map((id) => ({_type: 'reference', _ref: id, _key: id}))
  const transaction = client
    .transaction()
    .createIfNotExists({_id: 'landingPage', _type: 'landingPage'})
    .patch('landingPage', {set: {slides: value}})
  // Keep an open, unpublished edit of the Landing page in step too
  const draft = await client.fetch<string | null>('*[_id == "drafts.landingPage"][0]._id')
  if (draft) transaction.patch(draft, {set: {slides: value}})
  return transaction.commit({visibility: 'async'})
}

/** The slideshow order with switched-off pieces dropped and new ones added at the end, or null if unchanged */
export function slideOrder(current: string[], on: string[]) {
  const next = [...current.filter((id) => on.includes(id)), ...on.filter((id) => !current.includes(id))]
  return next.length === current.length && next.every((id, i) => id === current[i]) ? null : next
}

export function LandingPicker() {
  return (
    <PiecePicker
      flag="showOnLanding"
      place="In the slideshow"
      intro="Click a piece to add it to the landing page slideshow or take it off. Each click saves right away, and the site updates a few minutes after you finish. New pieces join the end of the slideshow; drag them into order on the Order and settings tab."
      settle={syncLandingSlides}
    />
  )
}
