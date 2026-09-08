import { provideZonelessChangeDetection } from '@angular/core'

// The application is zoneless; tests have to be too, or change detection would
// behave differently here than it does when the app runs.
export default [provideZonelessChangeDetection()]
