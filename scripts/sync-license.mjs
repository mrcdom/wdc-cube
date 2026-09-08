/**
 * Copies the root LICENSE into the package being packed.
 *
 * npm includes a LICENSE that sits in the package's own directory, and ignores
 * one anywhere else — so without this a published tarball names MIT in its
 * metadata and carries nothing that says what MIT is. A copy per package
 * checked into the repository would do the same job and drift; this runs from
 * `prepack`, so the terms have one source and reach every package from it.
 */
import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

copyFileSync(join(root, 'LICENSE'), join(cwd(), 'LICENSE'))
