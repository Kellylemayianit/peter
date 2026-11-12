# Becca: modular vanilla-JS SPA

No build step, no dependencies. ES modules only.

## Run it
ES modules don't load from file://, so serve the folder:

    cd becca
    python3 -m http.server 8000     # or: npx serve
    # open http://localhost:8000

## Structure
    index.html            one mount point (#app) + module entry
    css/                  tokens (theme vars), base, components, layout (responsive)
    js/main.js            wires store + router + app shell
    js/core/              dom.js (h()), store.js, router.js, actions.js, format.js
    js/components/        small reusable pieces (kpiCard, probBar, sidebar, ...)
    js/views/             one module per route (home, assistant, football, ...)
    js/data/              mock.js (seed data), replies.js (stub assistant)

## Adding a page
1. Create js/views/foo.js:
       export default { title: 'Foo', reactive: true, render({ store, navigate }) { return h('div', ...) } }
2. Add `foo: () => import('./views/foo.js')` to `routes` in main.js.
3. (Optional) add it to `nav` in data/mock.js to get a sidebar link.

`reactive: true` re-renders the view when the store changes; `false` means the view manages its own DOM (the chat does this so typing isn't lost).

## Going real
- Replace `replyFor()` in data/replies.js with a fetch() to your backend.
- Replace seed data in data/mock.js with API calls; views only read from the store.
