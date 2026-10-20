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
