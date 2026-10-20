import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {PanPathInput} from '../../components/PanPathInput'

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
      name: 'video',
      type: 'file',
      description:
        'Optional. Add an MP4 to show a video for this piece. The image above is used as its cover until it plays.',
      options: {accept: 'video/mp4,video/webm,video/quicktime'},
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
      name: 'showOnLanding',
      title: 'Include on landing page',
      type: 'boolean',
      description:
        'Adds this piece to the full-screen slideshow on the home page. Set the order under Landing page. Drag the circle on the image (Edit hotspot) to choose which part stays in view when the screen crops it.',
      initialValue: false,
    }),
    defineField({
      name: 'landingFit',
      title: 'Landing page fit',
      type: 'string',
      description:
        'Automatic fills the screen. A tall piece on a wide monitor is shown whole over a soft blur of itself instead. On phones, a wide piece starts at its hotspot and slowly pans toward the side with more of the piece.',
      initialValue: 'auto',
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          {title: 'Automatic', value: 'auto'},
          {title: 'Always fill the screen', value: 'fill'},
          {title: 'Always show the whole piece', value: 'whole'},
        ],
      },
      hidden: ({document}) => !document?.showOnLanding,
    }),
    defineField({
      name: 'landingMotion',
      title: 'Landing page motion',
      type: 'string',
      description:
        'How the view drifts while this piece is on screen and cropped. Automatic pans wide pieces on phones toward the side with more of the piece.',
      initialValue: 'auto',
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          {title: 'Automatic', value: 'auto'},
          {title: 'Follow my path', value: 'path'},
          {title: 'Stay still', value: 'still'},
        ],
      },
      hidden: ({document}) => !document?.showOnLanding,
    }),
    defineField({
      name: 'landingPan',
      title: 'Pan path',
      type: 'object',
      description:
        'Starts at the hotspot and glides to the point you click, at the Pan speed set on the Landing page. The piece stays on screen until it arrives. Works on any screen where the piece is cropped; to pan down a tall piece on computers too, set Landing page fit to Always fill the screen.',
      fields: [
        defineField({name: 'x', type: 'number'}),
        defineField({name: 'y', type: 'number'}),
      ],
      components: {input: PanPathInput},
      hidden: ({document}) => !document?.showOnLanding || document?.landingMotion !== 'path',
    }),
  ],
  orderings: [
    {title: 'Year, newest first', name: 'yearDesc', by: [{field: 'year', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'year', media: 'image'},
  },
})
