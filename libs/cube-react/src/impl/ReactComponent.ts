/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ReactComponent<P = unknown, S = unknown, SS = any> extends React.Component<P, S, SS> {
    public override UNSAFE_componentWillMount() {
        this.attached()
    }

    public override componentWillUnmount(): void {
        this.detached()
    }

    protected attached() {
        // NOOP
    }

    protected detached() {
        // NOOP
    }
}
