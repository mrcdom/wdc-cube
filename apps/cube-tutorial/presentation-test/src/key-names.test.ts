import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Every parameter and attribute name must be unique in the application, because a flip
// passes the same intent through every `applyParameters` on the path: two owners of one
// name overwrite each other silently. Each `*.key.ts` therefore declares its names in
// local tables (`P`, `A`), all starting with a two-letter PREFIX of its own. This test
// keeps that rule from depending on anyone remembering it.

const MODULES = fileURLToPath(new URL('../../presentation/src/modules', import.meta.url))

type KeysFile = {
    path: string
    prefix?: string
    codes: string[]
    malformed: string[]
    loose: string[]
}

function findKeysFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) return findKeysFiles(path)
        return entry.name.endsWith('.key.ts') ? [path] : []
    })
}

function parse(path: string): KeysFile {
    const source = readFileSync(path, 'utf8')
    const prefix = /const PREFIX = '([^']*)'/.exec(source)?.[1]

    const codes: string[] = []
    const malformed: string[] = []
    for (const table of source.matchAll(/const [PA] = \{([\s\S]*?)\} as const/g)) {
        for (const line of table[1].split('\n').map((l) => l.trim().replace(/,$/, ''))) {
            if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue
            const entry = /^\w+:\s*`\$\{PREFIX\}-([^`]+)`$/.exec(line)
            if (entry) codes.push(entry[1])
            else malformed.push(line)
        }
    }

    // Any name handed to the intent must come from one of the tables.
    const loose: string[] = []
    const access =
        /(?:getParameter\w*|setParameter|getScopeSlot|setScopeSlot|attributes\.(?:get|set|has|delete))\(\s*([^,)]+)/g
    for (const call of source.matchAll(access)) {
        const name = call[1].trim()
        if (!/^[PA]\.\w+$/.test(name)) loose.push(name)
    }

    return { path: relative(MODULES, path), prefix, codes, malformed, loose }
}

const files = findKeysFiles(MODULES).map(parse)

describe('key names', () => {
    it('finds the keys files', () => {
        expect(files.length).toBeGreaterThan(0)
    })

    it.each(files)('$path: every name comes from its own tables', (file) => {
        expect(file.loose, 'names written outside the P/A tables').toEqual([])
        expect(file.malformed, 'table entries not shaped as `${PREFIX}-code`').toEqual([])
        if (file.codes.length > 0) {
            expect(file.prefix, 'a file that declares names needs a PREFIX').toMatch(/^[a-z]{2}$/)
        }
        expect(file.codes.length, 'a local code used twice').toBe(new Set(file.codes).size)
    })

    it('gives every keys file a prefix of its own', () => {
        const owners = new Map<string, string[]>()
        for (const file of files) {
            if (file.prefix) owners.set(file.prefix, [...(owners.get(file.prefix) ?? []), file.path])
        }
        const shared = [...owners].filter(([, paths]) => paths.length > 1)
        expect(shared, 'prefixes used by more than one keys file').toEqual([])
    })
})
