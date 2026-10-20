import {useCallback, useMemo, useRef, type PointerEvent} from 'react'
import {set, unset, useClient, useFormValue, type ObjectInputProps} from 'sanity'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {createImageUrlBuilder} from '@sanity/image-url'

type Point = {x: number; y: number}

interface ImageValue {
  asset?: {_ref: string}
  hotspot?: Point
}

/**
 * Shows the artwork and lets her click where the landing page pan should start.
 * The pan always ends on the image's hotspot (the yellow dot).
 */
export function PanPathInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const end = typeof value?.x === 'number' && typeof value?.y === 'number' ? (value as Point) : undefined
  const image = useFormValue(['image']) as ImageValue | undefined
  const client = useClient({apiVersion: '2025-08-15'})
  const frame = useRef<HTMLDivElement>(null)

  const src = useMemo(() => {
    if (!image?.asset?._ref) return null
    return createImageUrlBuilder(client).image(image.asset._ref).width(900).auto('format').url()
  }, [client, image?.asset?._ref])

  const start: Point = image?.hotspot ?? {x: 0.5, y: 0.5}

  const pick = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const rect = frame.current!.getBoundingClientRect()
      const round = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000
      onChange(
        set({
          x: round((event.clientX - rect.left) / rect.width),
          y: round((event.clientY - rect.top) / rect.height),
        }),
      )
    },
    [onChange],
  )

  if (!src) {
    return (
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>Add an image first, then click on it here to choose where the pan starts.</Text>
      </Card>
    )
  }

  return (
    <Stack gap={3}>
      <Card radius={2} border overflow="hidden">
        <div
          ref={frame}
          onPointerDown={pick}
          style={{position: 'relative', cursor: 'crosshair', lineHeight: 0, userSelect: 'none'}}
        >
          <img src={src} alt="" draggable={false} style={{width: '100%', display: 'block'}} />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
          >
            {end && (
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
          <Marker point={start} color="#ffcf33" label="End (hotspot)" />
          {end && <Marker point={end} color="#4e2f1b" label="Start" />}
        </div>
      </Card>
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <Text size={1} muted>
            {end
              ? 'The view starts on the brown dot and glides to the yellow one. Click anywhere to move the start.'
              : 'Click on the piece where the pan should start. It ends on the hotspot (yellow dot), which you set on the image above.'}
          </Text>
        </Box>
        {end && <Button text="Clear" mode="ghost" onClick={() => onChange(unset())} />}
      </Flex>
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
        width: 18,
        height: 18,
        margin: '-9px 0 0 -9px',
        borderRadius: '50%',
        background: color,
        border: '3px solid #fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }}
    />
  )
}
