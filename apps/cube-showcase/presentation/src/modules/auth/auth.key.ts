import { MainKeys } from '../main/main.key'
import { ParamIds, Places } from '../RouteConsts'

export class SignInKeys extends MainKeys {
    public override get place() {
        return Places.signIn
    }

    /**
     * Where the reader was going when the door stopped them.
     *
     * A whole intent as one parameter — `project/issues?project=p1&view=board`
     * — so it is encoded on the way in and decoded on the way out. Without that
     * it does not survive: the framework writes query values with `encodeURI`,
     * which leaves `?` and `&` alone, so the address came back parsed as
     * separate parameters and everything after the first `?` was lost. Measured:
     * `project/issues?project=p1&view=board&state=todo` read back as
     * `project/issues`.
     *
     * A parameter rather than something the shell holds, because it has to
     * survive a reload: someone who opens a link, is asked to sign in, and
     * refreshes the page should still land where they were sent.
     */
    public get next(): string | undefined {
        const value = this._intent.getParameterAsString(ParamIds.Next)
        return value ? decodeURIComponent(value) : undefined
    }

    public set next(value: string | undefined) {
        this._intent.setParameter(ParamIds.Next, value ? encodeURIComponent(value) : undefined)
    }
}
