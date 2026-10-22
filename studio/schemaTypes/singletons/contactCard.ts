import {defineArrayMember, defineField, defineType} from 'sanity'
import {AddUserIcon} from '@sanity/icons/AddUser'

export const contactCard = defineType({
  name: 'contactCard',
  title: 'Contact card',
  type: 'document',
  icon: AddUserIcon,
  description:
    'The page people reach by scanning your QR code (thatartsyunicorn.com/hi), and the card its Add to contacts button saves to their phone. Your name and social links come from the Landing page, and your email from the About page.',
  fields: [
    defineField({
      name: 'photo',
      type: 'image',
      description:
        'Shown in a circle on the page and saved with your card. Use the crop tool to frame your face and shoulders in a square; a cut-out gets a white background.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'jobTitle',
      title: 'Job title',
      type: 'string',
      description: 'Under your name on the page and in their contacts.',
      initialValue: 'Illustrator & Concept Artist',
    }),
    defineField({
      name: 'event',
      type: 'string',
      description:
        'Saved as “Met at …” in the company line of your card, so people can search their contacts for it, and starts the email subject “We met at …”. Change it before each event, or clear it.',
    }),
    defineField({
      name: 'note',
      type: 'text',
      rows: 3,
      description: 'Optional. Extra lines for the notes on your card, under the “Met at …” line. Not shown on the page.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone number',
      type: 'string',
      description:
        'Only ever saved inside the card, never shown on the page, and only until the time below.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          const digits = value.replace(/\D/g, '')
          return digits.length >= 10 && digits.length <= 15 ? true : 'Enter the full number, like (555) 555-0123'
        }),
    }),
    defineField({
      name: 'phoneUntil',
      title: 'Share phone number until',
      type: 'datetime',
      description:
        'After this, the card leaves your phone number out on its own. Set a new date before your next event. Leave empty to never share it.',
      options: {timeStep: 15},
    }),
    defineField({
      name: 'pieces',
      type: 'array',
      description: 'Shown under your contact details, each linking to its project. Three or four look best. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'artwork'}],
          options: {filter: 'defined(image.asset)', disableNew: true},
        }),
      ],
      validation: (rule) => rule.max(6).unique(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Contact card'}),
  },
})
