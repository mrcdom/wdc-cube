/**
 * Hands SolidJS the instrumentation of every scope, before any scope exists.
 *
 * Imported first by `main.tsx`, and that ordering is its whole reason to be a
 * module: `@Observable` installs a class's accessors the first time one of its
 * instances is built, so whoever decides what those accessors do has to say so
 * before then.
 */
import { useSolidScopes } from 'wdc-cube-solid'

useSolidScopes()
