import {useCallback, useMemo, useRef, useState, type PointerEvent} from 'react'
import {set, unset, useClient, useDocumentOperation, useFormValue, type ObjectInputProps} from 'sanity'
import {Box, Button, Card, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {createImageUrlBuilder} from '@sanity/image-url'

type Point = {x: number; y: number}

interface PanValue {
  x?: number
  y?: number
  separateEnd?: boolean
  endX?: number
  endY?: number
}

interface ImageValue {
  asset?: {_ref: string}
  hotspot?: Point & {width?: number; height?: number}
}

type Dot = 'start' | 'end'

const round = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000

/**
 * Shows the artwork with two dots she can drag: brown is where the landing page pan starts,
 * yellow is where it comes to rest. Normally the yellow dot is the image's hotspot, so moving it
 * also changes how the piece is framed when it sits still. With "separate end point" ticked, the
 * yellow dot belongs to the pan alone.
 */
export function PanPathInput(props: ObjectInputProps) {
  const {onChange} = props
  const value = (props.value ?? {}) as PanValue
  const image = useFormValue(['image']) as ImageValue | undefined
  const documentId = useFormValue(['_id']) as string
  const documentType = useFormValue(['_type']) as string
  const {patch} = useDocumentOperation(documentId.replace(/^drafts\./, ''), documentType)
  const client = useClient({apiVersion: '2025-08-15'})
  const frame = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<Dot | null>(null)
  // While dragging the hotspot, show it moving before the save comes back
  const [liveEnd, setLiveEnd] = useState<Point | null>(null)

  const src = useMemo(() => {
    if (!image?.asset?._ref) return null
    return createImageUrlBuilder(client).image(image.asset._ref).width(900).auto('format').url()
  }, [client, image?.asset?._ref])

  const separate = value.separateEnd === true
  const start = typeof value.x === 'number' && typeof value.y === 'number' ? {x: value.x, y: value.y} : undefined
  const hotspot: Point = image?.hotspot ? {x: image.hotspot.x, y: image.hotspot.y} : {x: 0.5, y: 0.5}
  const ownEnd = typeof value.endX === 'number' && typeof value.endY === 'number' ? {x: value.endX, y: value.endY} : undefined
  const end = liveEnd ?? (separate ? (ownEnd ?? hotspot) : hotspot)

  const pointAt = (event: PointerEvent) => {
    const rect = frame.current!.getBoundingClientRect()
    return {x: round((event.clientX - rect.left) / rect.width), y: round((event.clientY - rect.top) / rect.height)}
  }

  const save = useCallback(
    (dot: Dot, point: Point) => {
      if (dot === 'start') {
        onChange([set(point.x, ['x']), set(point.y, ['y'])])
      } else if (separate) {
        onChange([set(point.x, ['endX']), set(point.y, ['endY'])])
      } else {
        patch.execute([
          {
            set: {
              'image.hotspot': {
                _type: 'sanity.imageHotspot',
                x: point.x,
                y: point.y,
                width: image?.hotspot?.width ?? 0.3,
                height: image?.hotspot?.height ?? 0.3,
              },
            },
          },
        ])
      }
    },
    [image?.hotspot?.height, image?.hotspot?.width, onChange, patch, separate],
  )

  const near = (a: Point, b: Point) => {
    const rect = frame.current!.getBoundingClientRect()
    return Math.hypot((a.x - b.x) * rect.width, (a.y - b.y) * rect.height) < 18
  }

  const down = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointAt(event)
    // Grab whichever dot is under the pointer; a click elsewhere places the start dot
    const dot: Dot = near(point, end) && !(start && near(point, start)) ? 'end' : 'start'
    frame.current!.setPointerCapture(event.pointerId)
    setDragging(dot)
    if (dot === 'start') save('start', point)
    else setLiveEnd(point)
  }

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const point = pointAt(event)
    if (dragging === 'start') save('start', point)
    else setLiveEnd(point)
  }

  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging === 'end') save('end', pointAt(event))
    setDragging(null)
    setLiveEnd(null)
  }

  const toggleSeparate = () => {
    if (separate) {
      onChange([unset(['separateEnd']), unset(['endX']), unset(['endY'])])
    } else {
      // Start the separate end where the hotspot is, so nothing jumps
      onChange([set(true, ['separateEnd']), set(hotspot.x, ['endX']), set(hotspot.y, ['endY'])])
    }
  }

  if (!src) {
    return (
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>Add an image first, then set the pan path on it here.</Text>
      </Card>
    )
  }

  return (
    <Stack gap={3}>
      <Card radius={2} border overflow="hidden">
        <div
          ref={frame}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => {
            setDragging(null)
            setLiveEnd(null)
          }}
          style={{position: 'relative', cursor: dragging ? 'grabbing' : 'crosshair', lineHeight: 0, userSelect: 'none', touchAction: 'none'}}
        >
          <img src={src} alt="" draggable={false} style={{width: '100%', display: 'block'}} />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
          >
            {start && (
              <line
                x1={start.x * 100}
                y1={start.y * 100}
                x2={end.x * 100}
                y2={end.y * 100}
                stroke="#fff"
                strokeWidth={3}
                strokeDasharray="8 6"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          <Marker point={end} color="#ffcf33" label={separate ? 'End' : 'End (hotspot)'} />
          {start && <Marker point={start} color="#4e2f1b" label="Start" />}
        </div>
      </Card>
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <Text size={1} muted>
            {start
              ? 'Drag the brown dot to where the pan starts and the yellow dot to where it comes to rest. Click anywhere else to move the start.'
              : 'Click on the piece where the pan should start. It glides to the yellow dot, which you can drag too.'}
          </Text>
        </Box>
        {start && <Button text="Clear" mode="ghost" onClick={() => onChange([unset(['x']), unset(['y'])])} />}
      </Flex>
      <Card padding={3} radius={2} border tone={separate ? 'primary' : 'default'}>
        <Flex gap={3} align="flex-start">
          <Checkbox id="pan-separate-end" checked={separate} onChange={toggleSeparate} style={{marginTop: 2}} />
          <Stack gap={2} flex={1}>
            <Text size={1} weight="medium">
              <label htmlFor="pan-separate-end">Give the pan its own end point</label>
            </Text>
            <Text size={1} muted>
              Off (usual): the yellow dot is this piece's hotspot. Moving it also changes which part of the piece
              stays in view when the slideshow shows it still, for example on computers. Turn this on only if
              you want the pan to finish somewhere different from that still framing.
            </Text>
          </Stack>
        </Flex>
      </Card>
    </Stack>
  )
}

function Marker({point, color, label}: {point: Point; color: string; label: string}) {
  return (
    <div
      title={label}
      style={{
        position: 'absolute',
        left: `${point.x * 100}%`,
        top: `${point.y * 100}%`,
        width: 22,
        height: 22,
        margin: '-11px 0 0 -11px',
        borderRadius: '50%',
        background: color,
        border: '3px solid #fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
        cursor: 'grab',
        pointerEvents: 'none',
      }}
    />
  )
}
