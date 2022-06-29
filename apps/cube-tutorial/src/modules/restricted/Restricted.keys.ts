import { Places } from '../../Constants'
import { MainKeys } from '../../main/Main.keys'

export class RestrictedKeys extends MainKeys {

    public get place() {
        return Places.restricted
    }

}