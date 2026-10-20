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
      description:
        'Used for the browser tab, search results and screen readers. The lettered name on the card is artwork, so changing this does not redraw it.',
      initialValue: 'Cordelia Moore',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'socials',
      title: 'Social links',
      type: 'object',
      description: 'Shown as round buttons at the bottom of the landing page. Leave one empty to hide its button.',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({name: 'instagram', title: 'Instagram', type: 'url'}),
        defineField({name: 'cara', title: 'Cara', type: 'url'}),
        defineField({name: 'linkedin', title: 'LinkedIn', type: 'url'}),
        defineField({name: 'artstation', title: 'ArtStation', type: 'url'}),
      ],
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
      description: 'Pieces with a pan path stay up longer if their path needs it.',
      initialValue: 5,
      validation: (rule) => rule.required().min(2).max(30),
    }),
    defineField({
      name: 'panSpeed',
      title: 'Pan speed',
      type: 'number',
      description:
        'How fast every moving piece drifts. A piece with a pan path stays on screen until its path is finished, so longer paths show longer rather than faster.',
      initialValue: 28,
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          {title: 'Very slow', value: 15},
          {title: 'Slow', value: 22},
          {title: 'Gentle', value: 28},
          {title: 'Medium', value: 40},
          {title: 'Quick', value: 60},
        ],
      },
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
