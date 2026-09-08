import { ProjectKeys } from '../project/project.key'
import { Places } from '../RouteConsts'

export class DashboardKeys extends ProjectKeys {
    public override get place() {
        return Places.dashboard
    }
}
