import {defineField, defineType} from 'sanity'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'

export const notFoundPage = defineType({
  name: 'notFoundPage',
  title: 'Page not found',
  type: 'document',
  icon: LinkRemovedIcon,
  description: 'Shown when someone follows a broken link or mistypes an address on your site.',
  fields: [
    defineField({
      name: 'heading',
      type: 'string',
      initialValue: 'You’ve wandered off the path',
    }),
    defineField({
      name: 'message',
      type: 'text',
      rows: 3,
      description: 'Buttons to Home, Projects and Portfolio are added below it.',
      initialValue: 'The page you’re looking for isn’t here. It may have moved, or the link may have a typo.',
    }),
    defineField({
      name: 'art',
      title: 'Piece to show',
      type: 'reference',
      to: [{type: 'artwork'}],
      description:
        'Optional. Its title under the picture links to its project. Leave empty to show the first piece of the landing slideshow.',
      options: {filter: 'defined(image.asset)', disableNew: true},
    }),
  ],
  preview: {
    prepare: () => ({title: 'Page not found'}),
  },
})
