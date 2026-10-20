import {artwork} from './documents/artwork'
import {project} from './documents/project'
import {landingPage} from './singletons/landingPage'
import {projectsPage} from './singletons/projectsPage'
import {aboutPage} from './singletons/aboutPage'
import {portfolioPage} from './singletons/portfolioPage'
import {notFoundPage} from './singletons/notFoundPage'

export const singletonTypes = new Set(['landingPage', 'projectsPage', 'aboutPage', 'portfolioPage', 'notFoundPage'])

export const schemaTypes = [landingPage, projectsPage, aboutPage, portfolioPage, notFoundPage, project, artwork]
