import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'ke2xjwml',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Hosted at https://thatartsyunicorn.sanity.studio
  studioHost: 'thatartsyunicorn',
  deployment: {
    appId: 'z67lmqqgzk00ef3dfxjzn2fr',
  },
})
