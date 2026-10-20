import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'

export const portfolioPage = defineType({
  name: 'portfolioPage',
  title: 'Portfolio page',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'intro',
      type: 'text',
      rows: 2,
      description: 'Optional. A line shown above the pieces.',
    }),
    defineField({
      name: 'order',
      title: 'Pieces to show first',
      type: 'array',
      description:
        'Optional. Drag to choose which pieces lead the page. Every other piece on the portfolio follows, project by project in the order of the Projects page.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'artwork'}],
          options: {filter: 'showOnPortfolio == true', disableNew: true},
        }),
      ],
      options: {layout: 'grid'},
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Portfolio page'}),
  },
})
