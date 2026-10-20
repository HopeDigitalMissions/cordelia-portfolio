import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'

export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Upload the full-resolution original. The site generates smaller versions automatically.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'A short description of the piece for screen readers and search engines.',
          validation: (rule) => rule.required().warning('Alt text helps accessibility and search'),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      type: 'number',
      validation: (rule) => rule.integer().min(1900).max(2100),
    }),
    defineField({
      name: 'medium',
      type: 'string',
      description: 'For example: Digital painting, Procreate',
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      description: 'Show this piece on the home page.',
      initialValue: false,
    }),
  ],
  orderings: [
    {title: 'Year, newest first', name: 'yearDesc', by: [{field: 'year', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'year', media: 'image'},
  },
})
