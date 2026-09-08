import { Scope } from 'wdc-cube'

/**
 * A place with nothing to draw.
 *
 * `ProjectPresenter` decides who may be inside a project, remembers which one is
 * selected, holds the record and the people, and says what the sidebar offers.
 * None of that is a screen: the screens are its children, and they fill the
 * shell's slot themselves. `CubePresenter` needs a scope, so this is the
 * smallest honest one — and its absence from the view catalog is the statement
 * that this place is structure rather than surface.
 */
export class ProjectScope extends Scope {}
