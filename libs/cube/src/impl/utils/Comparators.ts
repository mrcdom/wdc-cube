/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
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
