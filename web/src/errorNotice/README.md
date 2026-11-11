# errorNotice

When something breaks, a small bar says so and offers "Copy error details" and Dismiss.

- `watch.ts`: `watchErrors()` listens for window `error` and `unhandledrejection` (called by `main.ts`, `play.ts`, `dosPage/dosPage.ts`). Tiny; loads the notice only on an error.
- `notice.ts`: the bar (role alert, 24 px targets, wraps at 375 px). Falls back to a selectable text box when the Clipboard API refuses.
- `details.ts`: the copied text: message, build, route (the page path and the whole hash route with its parameters; the URL's own query string is left out), browser name, screen size. Nothing is sent anywhere; it is copied only when the button is pressed.
