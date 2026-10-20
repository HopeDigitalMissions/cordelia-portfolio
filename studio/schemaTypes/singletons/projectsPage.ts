import {defineArrayMember, defineField, defineType} from 'sanity'
import {ProjectsIcon} from '@sanity/icons/Projects'

export const projectsPage = defineType({
  name: 'projectsPage',
  title: 'Projects page',
  type: 'document',
  icon: ProjectsIcon,
  fields: [
    defineField({
      name: 'intro',
      type: 'text',
      rows: 2,
      description: 'Optional. A line shown above the project cards.',
    }),
    defineField({
      name: 'order',
      title: 'Project order',
      type: 'array',
      description: 'Drag to reorder the cards. Projects missing from this list still show, after these, A to Z.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'project'}], options: {disableNew: true}})],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Projects page'}),
  },
})
