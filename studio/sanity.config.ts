import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes, singletonTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: "Cordelia's Portfolio",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'ke2xjwml',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Landing page')
              .id('landingPage')
              .child(S.document().schemaType('landingPage').documentId('landingPage')),
            S.listItem()
              .title('Projects page')
              .id('projectsPage')
              .child(S.document().schemaType('projectsPage').documentId('projectsPage')),
            S.divider(),
            S.documentTypeListItem('project').title('Projects'),
            S.documentTypeListItem('artwork').title('Artwork'),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    // Singletons can't be created from the "new document" menu
    templates: (templates) => templates.filter(({schemaType}) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (actions, {schemaType}) =>
      singletonTypes.has(schemaType)
        ? actions.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
})
