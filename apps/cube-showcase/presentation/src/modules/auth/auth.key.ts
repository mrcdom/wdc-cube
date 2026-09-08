import { MainKeys } from '../main/main.key'
import { Places } from '../RouteConsts'

export class SignInKeys extends MainKeys {
    public override get place() {
        return Places.signIn
    }
}
