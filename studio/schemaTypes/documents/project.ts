import {defineArrayMember, defineField, defineType} from 'sanity'
import {ProjectsIcon} from '@sanity/icons/Projects'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ProjectsIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'The end of the web address, for example /projects/humblets.',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      description: 'Optional. A few lines shown under the title on the project page.',
    }),
    defineField({
      name: 'pieces',
      type: 'array',
      description: 'Drag to reorder. Each piece is an Artwork, so it can also appear on the landing page.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'artwork'}]})],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'cover',
      title: 'Card image',
      type: 'image',
      description:
        'The picture on this project\'s card. Choose "Select" to reuse one of the pieces, then use the crop tool to trim away sheet borders or captions and drag the hotspot onto the subject. The card is a tall poster shape. Leave empty to use the first piece.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'cover', fallback: 'pieces.0.image', count: 'pieces'},
    prepare: ({title, media, fallback, count}) => ({
      title,
      subtitle: Array.isArray(count) ? `${count.length} pieces` : undefined,
      media: media ?? fallback,
    }),
  },
})
