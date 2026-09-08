import { ProjectKeys } from '../project/project.key'
import { Places } from '../RouteConsts'

/** Choosing a project, which is the one place inside `project` that has none. */
export class ProjectsKeys extends ProjectKeys {
    public override get place() {
        return Places.projects
    }
}
