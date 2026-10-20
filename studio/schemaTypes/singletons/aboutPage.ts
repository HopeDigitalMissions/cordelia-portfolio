import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'

// Plain paragraphs with bold, italic and links; the page has its own headings
const paragraphs = defineArrayMember({
  type: 'block',
  styles: [{title: 'Normal', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [
      {title: 'Bold', value: 'strong'},
      {title: 'Italic', value: 'em'},
    ],
  },
})

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'photo',
      type: 'image',
      description:
        'A cut-out (a PNG with a see-through background) stands in front of a white arch; the arch is centered on the hotspot circle and its top sits at the circle’s height, so drag the circle onto your face. An ordinary photo gets a white frame instead.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'A short description of the photo for screen readers and search engines.',
          validation: (rule) => rule.required().warning('Alt text helps accessibility and search'),
        }),
        defineField({
          name: 'archBottom',
          title: 'Arch bottom',
          type: 'number',
          description:
            'Optional, for cut-outs. Lifts the bottom of the white arch this many percent of the photo\u2019s height, so a foot can step out past its edge. Leave empty to run the arch to the bottom of the photo.',
          validation: (rule) => rule.min(0).max(50),
        }),
      ],
    }),
    defineField({
      name: 'bio',
      type: 'array',
      description: 'The first paragraph is shown larger.',
      of: [paragraphs],
    }),
    defineField({
      name: 'workTitle',
      title: 'Work heading',
      type: 'string',
      initialValue: 'Work',
    }),
    defineField({
      name: 'work',
      type: 'array',
      description: 'Drag to reorder.',
      of: [
        defineArrayMember({
          name: 'workItem',
          title: 'Work',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              description: 'The show, book or client.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'note',
              type: 'string',
              description: 'Optional. Shown as a small tag, like “Rocky Mountain Emmy winner” or “Unreleased”.',
            }),
            defineField({
              name: 'role',
              type: 'string',
              description: 'Optional. Your role, like “Background artist”.',
            }),
          ],
          preview: {
            select: {title: 'title', role: 'role', note: 'note'},
            prepare: ({title, role, note}) => ({title, subtitle: [role, note].filter(Boolean).join(' · ')}),
          },
        }),
      ],
    }),
    defineField({
      name: 'contactTitle',
      title: 'Contact heading',
      type: 'string',
      initialValue: 'Work with me',
    }),
    defineField({
      name: 'contact',
      title: 'Contact text',
      type: 'array',
      of: [paragraphs],
    }),
    defineField({
      name: 'email',
      type: 'string',
      description: 'Shown as a button under the contact text. Leave empty to hide it.',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'resume',
      title: 'Résumé',
      type: 'file',
      description: 'Optional. A PDF visitors can download from a button next to your email.',
      options: {accept: 'application/pdf'},
    }),
  ],
  preview: {
    prepare: () => ({title: 'About page'}),
  },
})
