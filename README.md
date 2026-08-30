# Trail Brief

A no-build single-page hiking brief. The organizer can enter the weather and route briefing directly in the page. Hikers RSVP with a mountain-responsibility acknowledgement; the page calculates cars and tents from the group choices.

## Editing the hike

All organiser-controlled information lives in `hike.yaml`: title, dates, weather fallback, route details, and elevation profile. The page fetches and parses it automatically on load (via [js-yaml](https://github.com/nodeca/js-yaml)) — just edit the file and refresh; no button or rebuild needed. If `hike.yaml` can't be fetched (for example when the page is pasted as a single WordPress block with no separate file), the site falls back to the same data hard-coded as `DEFAULT_DATA` at the bottom of `app.js`.

The elevation profile is drawn from `mercantour-route.gpx` automatically once the interactive map loads; to swap in a different hike, replace that GPX file (keep the same filename, or update the `fetch('./mercantour-route.gpx')` call in `app.js`).

The three "hiking stages" cards are computed directly from that GPX track rather than hard-coded: the track is split into as many segments as the hike has days (from `start_date`/`end_date`), each labelled with its real date, distance, and ascent/descent — recomputing the actual Mercantour track gives Day 1 as a 9.4 km, +1,163 m climb to the 2,688 m high point, Day 2 as a 9.4 km high-altitude traverse (staying above 2,150 m), and Day 3 as a 9.4 km, −1,177 m descent back to the trailhead.

Weather is fetched live from [Open-Meteo](https://open-meteo.com) (no API key needed) using `weather.lat` / `weather.lon` in `hike.yaml` and the hike's `start_date`/`end_date`, and replaces the organiser's manual `weather:` block once it loads — that manual block is what's shown as a fallback while the live forecast loads, or if it's unreachable, or if the dates are too far out for Open-Meteo's ~16-day range.

## Shared RSVP storage (MySQL 8.4)

By default the RSVP list is stored only in each visitor's own browser (`localStorage`), so nobody sees a shared attendee count. This branch stores RSVPs in a MySQL 8.4 database instead, through a small PHP API (`api/rsvp.php`) — with the local-browser storage kept automatically as an offline fallback if that API isn't configured or is unreachable.

**GitLab Pages only serves static files — it cannot run PHP or talk to a database.** `api/rsvp.php` needs to be deployed on a separate PHP 8+ host that can reach your MySQL 8.4 server (for example your existing OVH hosting, which already runs PHP + MySQL for WordPress). The GitLab-hosted page then calls that API's public URL over HTTPS.

To set it up:

1. Create a MySQL 8.4 database (or reuse an existing one) and run `api/schema.sql` against it:
   ```
   mysql -u youruser -p your_database < api/schema.sql
   ```
2. Upload the whole `api/` folder to your PHP host, then copy `api/config.example.php` to `api/config.local.php` on that host (not in git — it's gitignored) and fill in your real `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASS`. If your host sets environment variables instead, `rsvp.php` falls back to `getenv('DB_HOST')` etc. when `config.local.php` is absent.
3. Visit `https://your-host/api/rsvp.php` directly — it should return `[]` (an empty JSON array) once the table is empty and reachable.
4. In `app.js`, set `RSVP_API_URL` near the top of the file to that URL.
5. Commit and push — GitLab Pages rebuilds automatically (see below).

Anyone with the page link can see the full attendee list, same as the current "Who's in" dashboard already shows to any visitor. `rsvp.php` uses prepared statements (no SQL injection risk from the name field) and a server-side honeypot check as a second line of defence behind the client-side one. It intentionally exposes no `update`/`delete` endpoint, so an RSVP can't be edited or removed once submitted. Do not put anything more sensitive than a name in this table. There's no realtime push with a plain PHP API, so the page polls the API every 20 seconds while the attendee dashboard is open, instead of updating instantly like a websocket-based backend would. Do not treat the acknowledgement text as legal advice; have a local professional review it for organised commercial events.

## Publish on GitLab Pages

GitLab Pages only builds from a project hosted on GitLab — pushing a branch to this GitHub repository does not deploy anything there by itself. To publish this branch:

1. Create a new project on [gitlab.com](https://gitlab.com) (or your self-hosted GitLab instance).
2. Add it as a second git remote and push this branch to it, e.g.:
   ```
   git remote add gitlab https://gitlab.com/YOUR-USERNAME/YOUR-PROJECT.git
   git push gitlab claude/gitlab-pages-mysql-rsvp:main
   ```
3. GitLab detects `.gitlab-ci.yml` in the repo root and runs the `pages` job automatically, which copies the site's static files into a `public/` artifact directory.
4. Once the pipeline succeeds, open **Settings → Pages** in the GitLab project to see the published URL — typically `https://YOUR-USERNAME.gitlab.io/YOUR-PROJECT/`, or `https://YOUR-USERNAME.gitlab.io` if the project is named `YOUR-USERNAME.gitlab.io`. HTTPS is included for free; a custom domain can be added under the same Pages settings.
5. `RSVP_API_URL` in `app.js` must point to your separately-hosted `api/rsvp.php` (step 4 in "Shared RSVP storage" above) — GitLab Pages itself only serves the static files, it can't run that script.

## Publish for free on GitHub Pages

1. Create a new GitHub repository and upload these three files to its root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
4. GitHub publishes it at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

For the shortest address, name the repository `YOUR-USERNAME.github.io`; GitHub Pages will publish it at `https://YOUR-USERNAME.github.io`. The `github.io` subdomain and HTTPS are free. A custom domain must be registered separately.

## Publishing on WordPress instead

This branch (`claude/gitlab-pages-mysql-rsvp`) is set up for GitLab Pages + MySQL specifically. For a WordPress deployment (Custom HTML block, optional Supabase-backed RSVP storage and organiser edit panel), see the `claude/wordpress-site-publication-2t1xde` branch instead — the two branches diverge on hosting target and RSVP backend, so pick whichever matches where you're actually publishing.

## Customise

Edit the hike date, meeting time, and kit reminder in `hike.yaml` (or `index.html`/`DEFAULT_DATA` for text that isn't organiser-controlled yet). The weather location is set via `weather.lat`/`weather.lon` in `hike.yaml`; no API key is needed for Open-Meteo's public endpoint.

## What's already improved

- Live weather (Open-Meteo) and `hike.yaml` are now actually wired up — see "Editing the hike" above.
- The hiking-stage cards are recomputed directly from the real GPX track (real per-day distance/ascent/descent), instead of four arbitrary quarters with generic labels — see "Editing the hike" above.
- Optional shared RSVP storage via a small PHP API backed by MySQL 8.4, with automatic fallback to the previous per-browser storage — see "Shared RSVP storage (MySQL 8.4)" above.
- GitLab Pages publishing via `.gitlab-ci.yml` — see "Publish on GitLab Pages" above.
- **Full bilingual coverage**: the EN/FR toggle now switches the nav, buttons, weather card, stats labels, and every dialog, not just the about/wildlife text.
- **Add-to-calendar button**: downloads a `.ics` file built from the hike's dates.
- **Share button**: uses the Web Share API on mobile, falls back to copying the link.
- **Honeypot spam protection**: a hidden field on the RSVP form silently rejects simple bots without any extra step for real visitors.
- **Print stylesheet**: printing the page (e.g. for a paper copy at the trailhead with no signal) hides the nav, buttons, gallery and map, and shows a clean brief.
- **Accessibility pass**: `aria-live` on the live attendee counts, `aria-label="Close"` on dialog close buttons, keyboard focus moving into dialogs on open.
- Social link previews (Open Graph tags) and a mountain-emoji favicon, so the link looks right when shared in a group chat.
- An "Export CSV" button in the organisation dashboard, so the organiser can download the attendee list.
- Gallery images use `loading="lazy"`, and the RSVP submit button disables itself with a "Saving…" state and a clear error message if the save fails, instead of silently doing nothing.

## Further ideas (site)

- **Self-hosted gallery images**: the wildlife photos are still hot-linked from external sites (an attempt to fetch and commit local copies in this pass was blocked by this session's sandboxed network); hosting your own resized copies would be more reliable, faster, and immune to the source site changing or removing them.
- **Offline / low-signal support**: a service worker caching the page shell, `hike.yaml`, and the GPX file so the brief still opens with no signal at the trailhead (the print stylesheet covers the "on paper" case, this would cover "on the phone, no bars").
- **Units toggle**: km/miles and °C/°F, for a mixed-nationality group.
- **Zoomable/pannable elevation chart**: the hand-rolled SVG profile is lightweight but fixed-scale; a small charting lib (or hand-written pan/zoom) would let hikers inspect specific sections of a longer route.
- **Structured data**: a JSON-LD `Event` block in `<head>` so the hike shows up with rich details (dates, location) if the link is ever indexed or pasted into calendar-aware apps.
- **Organiser edit panel**: the WordPress/Supabase branch has a passphrase-gated form for editing hike details from the browser; porting it to this branch would mean adding a `hike_data` table and a couple of endpoints to `api/rsvp.php` (or a new `api/hike.php`), with the same "not real authentication" caveat that version documents.
- **Rate limiting on RSVP**: the honeypot stops simple bots; capping inserts per IP/time window (e.g. a small table tracking recent IPs, checked before the `INSERT` in `rsvp.php`) would handle a determined spammer if the link is ever shared publicly.
- **HTTPS/CORS hardening on the API**: `rsvp.php` currently sends `Access-Control-Allow-Origin: *` for simplicity; once the GitLab Pages URL is final, restricting that header to just that origin would stop other sites from embedding the same API.

## Further ideas (content)

- **Safety and emergency info**: nearest mountain refuge, park rescue number (112 works throughout the EU/France for mountain rescue), and expected mobile coverage gaps along the route — currently only "limited phone coverage" is mentioned in the acknowledgement text, with no concrete numbers.
- **Park regulations reminder**: Mercantour is a national park with rules worth stating up front — dogs are banned in the core zone, camping is restricted to designated areas/bivouac hours, and picking plants or disturbing wildlife is prohibited.
- **Sunrise/sunset and moon phase**: relevant for a "camp under stars" trip and easy to compute client-side (or pull from Open-Meteo's `sunrise`/`sunset` daily fields, already available from the same API call used for weather) — also useful for planning when to start the day-three descent before dark.
- **Interactive packing checklist**: turn the one-line kit reminder into a checkable list (stored per-visitor like the settings), so each hiker can tick off water, layers, headlamp, etc.
- **Carpool/parking coordination**: the page already computes cars needed from group size; adding a simple "who's driving / who needs a seat" field per RSVP would close the loop on the actual logistics problem it's solving for.
- **Link to official trail conditions**: a link to the Mercantour park's or Outdooractive's live trail-closure/conditions page, since alpine routes can close after storms or snow outside summer.

## AI note

The route intelligence is transparent local analysis rather than a paid generative-AI service. To add narrative AI coaching later, send the calculated stats to an API from a protected backend/serverless function—never put a provider key in this front-end source.
