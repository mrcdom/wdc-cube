import { Place } from 'wdc-cube'

/**
 * The places: the points of the cube, filled in by `initialize` (see `Routes.ts`).
 *
 * Parameter and attribute NAMES do not live here. Each `*.key.ts` declares the names it
 * reads and writes in a local table, and every name starts with that file's two-letter
 * PREFIX (`tm-showing`, `sd-site`). The prefix is unique in the application; the rest of
 * the name only has to be unique within its file.
 *
 * The reason is the flip itself: an attempt to turn the cube to a face passes the SAME
 * intent through every `applyParameters` on the path, and it may detour or roll back
 * midway. Two owners using one name overwrite each other along the way, silently. A
 * global table looked like it prevented that, but nobody consults it when naming - with
 * a prefix per keys file, adding a name only means looking at that one file.
 */
export const Places = {
    main: Place.ROOT,
    todos: Place.UNKNOWN,
    subscriptions: Place.UNKNOWN,
    subscriptionsDetail: Place.UNKNOWN,
    restricted: Place.UNKNOWN
}
