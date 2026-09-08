import { MainKeys } from '../main/main.key'
import { Places } from '../RouteConsts'

export class ProjectsKeys extends MainKeys {
    public override get place() {
        return Places.projects
    }
}
