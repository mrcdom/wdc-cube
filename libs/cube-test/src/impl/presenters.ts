/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Application, Place, type ICubePresenter } from 'wdc-cube'

/**
 * The presenter mounted at `place`, typed, failing loudly when there is none.
 *
 * `Application#getPresenter` returns `ICubePresenter | undefined`, so a test
 * reaching for one writes a cast and an existence check every time — and a cast
 * over `undefined` turns a navigation that silently did not happen into a
 * `TypeError` several lines later, pointing at the wrong thing.
 */
export function presenterOf<P extends ICubePresenter>(app: Application, place: Place): P {
    const presenter = app.getPresenter(place)

    if (!presenter) {
        throw new Error(
            `No presenter is mounted at place "${place.name}". The application is at "${app.lastPlace.name}".`
        )
    }

    return presenter as P
}

/** Whether a presenter is currently mounted at `place`. */
export function hasPresenterAt(app: Application, place: Place): boolean {
    return app.getPresenter(place) !== undefined
}
