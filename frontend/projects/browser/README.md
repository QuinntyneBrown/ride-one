# @wattzup/browser

The browser edition's in-browser implementations of the `@wattzup/api` contracts (L2-088 to
L2-099, ADR 0017): the Web Bluetooth link to the bike, mirrors of `Wattzup.Protocol` and
`Wattzup.Core`, and IndexedDB storage. Only `app.config.browser.ts` imports it, through
`provideBrowserEdition()`, so the backend edition's bundle never contains it.

Compiled from source through the `@wattzup/browser` path alias; never built or published alone.
