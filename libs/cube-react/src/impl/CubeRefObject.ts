/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
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
