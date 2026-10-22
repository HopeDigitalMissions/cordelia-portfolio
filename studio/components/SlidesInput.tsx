import {useEffect} from 'react'
import {set, useClient, type ArrayOfObjectsInputProps} from 'sanity'
import {slideOrder} from './PiecePicker'

/**
 * The slideshow order list. When the Landing page opens, pieces switched on from their own page
 * are added to the end and switched-off ones are dropped, so the list always matches what plays.
 */
export function SlidesInput(props: ArrayOfObjectsInputProps) {
  const {onChange, value, renderDefault, readOnly} = props
  const client = useClient({apiVersion: '2025-08-15'})
  const refs = ((value ?? []) as {_ref?: string}[]).map((item) => item._ref ?? '')

  useEffect(() => {
    if (readOnly) return
    let cancelled = false
    client
      .fetch<string[]>(
        '*[_type == "artwork" && showOnLanding == true && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_createdAt desc)._id',
      )
      .then((on) => {
        const next = slideOrder(refs, on)
        if (!cancelled && next) onChange(set(next.map((id) => ({_type: 'reference', _ref: id, _key: id}))))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Only when the list first opens or its contents change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, readOnly, refs.join(',')])

  return renderDefault(props)
}
