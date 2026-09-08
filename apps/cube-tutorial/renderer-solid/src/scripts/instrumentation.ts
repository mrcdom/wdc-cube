/**
 * Hands SolidJS the instrumentation of every scope, before any scope exists.
 *
 * This module is imported first by `main.tsx`, and that ordering is the whole
 * of its reason to be a module of its own: `@Observable` installs a class's
 * accessors the first time one of its instances is built, so whoever wants to
 * decide what those accessors do has to say so before then. The framework
 * throws rather than let it happen late.
 */
import { useSolidScopes } from 'wdc-cube-solid'

useSolidScopes()
