import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'

export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Title line',
      type: 'string',
      description: 'The small line above your name.',
      initialValue: 'Illustrator & Concept Artist',
    }),
    defineField({
      name: 'name',
      type: 'string',
      initialValue: 'Cordelia Moore',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slides',
      title: 'Slideshow order',
      type: 'array',
      description:
        'Drag to reorder. Only pieces with "Include on landing page" switched on can be added. Switched-on pieces missing from this list still play, after these, newest first.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'artwork'}],
          options: {filter: 'showOnLanding == true', disableNew: true},
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'slideSeconds',
      title: 'Seconds per piece',
      type: 'number',
      initialValue: 5,
      validation: (rule) => rule.required().min(2).max(30),
    }),
    defineField({
      name: 'transition',
      type: 'string',
      initialValue: 'fade',
      options: {
        layout: 'radio',
        list: [
          {title: 'Quick cross-fade', value: 'fade'},
          {title: 'Quick dip to white', value: 'dip'},
        ],
      },
    }),
  ],
  preview: {
    prepare: () => ({title: 'Landing page'}),
  },
})
