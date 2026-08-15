# Resource Library — installable app

370 Java / Spring / backend resources organised by subject, with Saved and Done
marks that sync between your devices.

Works three ways, in increasing order of setup:

| | Setup | Offline | Syncs |
|---|---|---|---|
| Open `index.html` from disk | none | yes | no |
| Host it, install to home screen | 5 min | yes | no |
| Add the API | + deploy `../sync-api` | yes | **yes** |

---

## 1. Publish it (GitHub Pages)

```bash
cd app
git init
git add .
git commit -m "Resource library PWA"
git branch -M main
git remote add origin https://github.com/<you>/resources.git
git push -u origin main
```

Then **Settings → Pages → Source: `main`, folder `/ (root)` → Save**.

A minute later it is live at `https://<you>.github.io/resources/`.

Everything is referenced with relative paths (`./icons/…`, `./sw.js`), so it
works from a repository subpath without changes. `.nojekyll` stops GitHub
Pages' Jekyll step from touching the files.

> HTTPS is not optional here — a service worker will not register over
> `http://` or `file://`. GitHub Pages gives you HTTPS automatically, which is
> the main reason to host it rather than open the file directly.

## 2. Install it

- **Android / Chrome** — open the URL → menu → *Add to Home screen*. You get
  the icon, no browser chrome, and full offline use.
- **iPhone / Safari** — Share → *Add to Home Screen*. **It must be Safari**;
  Chrome on iOS cannot install PWAs.
- **Desktop Chrome / Edge** — install icon in the address bar.

## 3. Turn on sync

Deploy `../sync-api` (its README has the Render walkthrough), then in the app:

**Sync** in the sidebar → API base URL + token → **Save & sync now**.

Repeat on the second device with the same URL and token. That is the whole
setup — the two devices now converge.

---

## How syncing behaves

- **Local first.** A click is saved to this device immediately; the network
  call happens after, debounced ~1.5s so a burst of clicking is one request.
- **Offline is normal, not an error.** Changes queue and go out when you
  reconnect, and on the next launch.
- **Per-resource merge.** Mark something on your phone and something else on
  your laptop and both survive — conflicts are resolved per resource, newest
  wins, not "last device to sync overwrites everything".
- **Unmarking syncs too.** Removing a mark is recorded as a deliberate change,
  so the other device does not restore it.

The sidebar row shows the state: *Synced 4m ago*, *Offline · 3 pending*, or the
error if something is wrong. **Sync → Test connection** checks the URL alone,
before any token is involved.

---

## Updating the content

The 370 resources are inlined in `index.html`. To regenerate after changing the
source roadmap files, re-run the build scripts, then **bump `CACHE` in
`sw.js`** (`reslib-v1` → `reslib-v2`) — otherwise installed devices keep
serving the cached copy and will not see the new content.

---

## Privacy

Your marks are yours. Nothing is sent anywhere until you enter an API URL, and
then only to the server you deployed. The token is stored on the device and
sent only to that origin. There is no analytics of any kind, and the page loads
no third-party code — every asset is local, which is also why it works offline.
