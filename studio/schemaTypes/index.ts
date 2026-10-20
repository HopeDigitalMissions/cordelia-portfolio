import {artwork} from './documents/artwork'
import {project} from './documents/project'
import {landingPage} from './singletons/landingPage'
import {projectsPage} from './singletons/projectsPage'
import {portfolioPage} from './singletons/portfolioPage'

export const singletonTypes = new Set(['landingPage', 'projectsPage', 'portfolioPage'])

export const schemaTypes = [landingPage, projectsPage, portfolioPage, project, artwork]
