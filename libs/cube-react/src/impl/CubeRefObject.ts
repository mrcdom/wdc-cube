/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React from 'react'

export class CubeRefObject<T> implements React.RefObject<T | null> {
    public current: T | null

    constructor(elm?: T | null) {
        this.current = elm ?? null
    }
}
