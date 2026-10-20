import {artwork} from './documents/artwork'
import {project} from './documents/project'
import {landingPage} from './singletons/landingPage'
import {projectsPage} from './singletons/projectsPage'

export const singletonTypes = new Set(['landingPage', 'projectsPage'])

export const schemaTypes = [landingPage, projectsPage, project, artwork]
