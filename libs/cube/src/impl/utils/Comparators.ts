/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

export class Comparators {
    public static naturalOrderForNumber(a: number, b: number): number {
        return a - b
    }

    public static reverseOrderForNumber(a: number, b: number): number {
        return b - a
    }
}
