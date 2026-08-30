# Trail Brief

A no-build single-page hiking brief. The organiser enters the weather and route briefing directly in `hike.yaml`; the page shows live weather, a real GPX-derived route breakdown, and a quick group-logistics calculator.

## Editing the hike

All organiser-controlled information lives in `hike.yaml`: title, dates, weather fallback, route details, and elevation profile. The page fetches and parses it automatically on load (via [js-yaml](https://github.com/nodeca/js-yaml)) — just edit the file and refresh; no button or rebuild needed. If `hike.yaml` can't be fetched (for example when the page is pasted somewhere as a single block with no separate file), the site falls back to the same data hard-coded as `DEFAULT_DATA` at the bottom of `app.js`.

The elevation profile is drawn from `mercantour-route.gpx` automatically once the interactive map loads; to swap in a different hike, replace that GPX file (keep the same filename, or update the `fetch('./mercantour-route.gpx')` call in `app.js`).

The "hiking stages" cards are computed directly from that GPX track rather than hard-coded. This track carries named waypoints at the key stops — the parking at **Pont du Countet** (1,684 m) and the three refuges — so the page builds one card per real leg between them instead of guessing:

- **Pont du Countet → Refuge de Nice**: 5.0 km, +629 m / −90 m (first bivouac)
- **Refuge de Nice → Refuge de Valmasque**: 8.3 km, +698 m / −696 m (the hard part of day two)
- **Refuge de Valmasque → Refuge des Merveilles**: 8.4 km, +568 m / −673 m (second bivouac)
- **Refuge des Merveilles → Pont du Countet**: 6.5 km, +430 m / −867 m (descent back to the cars)

If a GPX file has fewer than two named waypoints, the page falls back to an even split across the hike's day count (from `start_date`/`end_date`) instead.

Weather is fetched live from [Open-Meteo](https://open-meteo.com) (no API key needed) using `weather.lat` / `weather.lon` in `hike.yaml` and the hike's `start_date`/`end_date`, and replaces the organiser's manual `weather:` block once it loads — that manual block is what's shown as a fallback while the live forecast loads, or if it's unreachable, or if the dates are too far out for Open-Meteo's ~16-day range.

## Group logistics ("How many of us?" section)

There's no RSVP or attendee list — instead, the "How many of us?" section near the bottom of the page is a plain client-side calculator: drag the slider (1–15 people) to set a headcount, and it shows how many cars and tents that implies (based on the "car comfort mode" and "people per tent" settings next to it), plus a small animated scene. Everything here is stored only in the visitor's own browser (`localStorage`), same as the settings used to be — there's no shared list, no signup, and nothing to configure or host. The slider is capped at 15 because the little car/hiker/tent icons are laid out in a fixed-size scene; past that the illustration gets crowded rather than because of any real logistics limit — raise `max` on `#party-size` in `index.html` if you need a bigger group (the icons wrap automatically, they just look better with fewer than ~20).

## Publish for free on GitHub Pages

This repository is already named `hikingpages.github.io`, which is GitHub's special naming convention for a user/organisation site:

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
3. GitHub publishes it at `https://hikingpages.github.io` directly (no `/REPOSITORY-NAME/` suffix, since the repo name matches the special `USERNAME.github.io` pattern). HTTPS is included for free; a custom domain can be added under the same Pages settings.

Since there's no backend at all in this branch (no database, no PHP), publishing is just pushing these static files — nothing else to deploy or configure.

## Publishing on WordPress instead

This branch (`claude/github-pages-mysql-rsvp`, despite the name — see note below) targets GitHub Pages specifically. For a WordPress deployment (Custom HTML block), see the `claude/wordpress-site-publication-2t1xde` branch instead — note that branch still has the older RSVP/attendee-list feature this branch has since removed.

> **Branch name note:** this branch was originally created for a MySQL-backed RSVP system, hence the name — that approach was dropped in favour of the simpler slider-based logistics calculator above, but the branch was kept rather than renamed again mid-work. Rename it (or open the PR under a clearer name) if you'd like the name to match its current contents.

## Customise

Edit the hike dates, meeting time, and kit reminder in `hike.yaml` (or `DEFAULT_DATA` in `app.js` for text that isn't organiser-controlled yet). The weather location is set via `weather.lat`/`weather.lon` in `hike.yaml`; no API key is needed for Open-Meteo's public endpoint.

## What's already improved

- Live weather (Open-Meteo) and `hike.yaml` are now actually wired up — see "Editing the hike" above.
- The hiking-stage cards are read from the GPX track's own named waypoints (real refuges and parking, real distance/ascent/descent) instead of an arbitrary split — see "Editing the hike" above.
- Replaced the RSVP/attendee-list system (and everything it needed — Supabase or MySQL, forms, dialogs) with a simple, backend-free group-logistics slider — see "Group logistics" above.
- Publishes directly on GitHub Pages, taking advantage of this repo's `hikingpages.github.io` name — see "Publish for free on GitHub Pages" above.
- **Full bilingual coverage, actually complete this time**: the hike title, meeting time, travel note, route difficulty/description and weather condition were still English-only in French mode (single-language fields in `hike.yaml`) — they now have `_en`/`_fr` variants and `load()` picks the right one. Previously only the nav/buttons/labels were translated while a good chunk of body copy stayed in English.
- **Fixed: the language toggle was invisible on mobile.** A leftover `@media(max-width:760px){.language{display:none}}` hid the only way to switch to French on any phone-sized screen — very likely why French "wasn't working" if tested on mobile. It's visible now, and the mobile nav no longer wraps text mid-word around it.
- **Fixed: the group-logistics animation broke past a handful of people.** Cars/hikers/tents used to be positioned with a fixed per-index pixel offset that ran the icons outside their box once the headcount grew — they're now laid out in a wrapping flexbox that stays inside the scene at any count, and the slider is capped at 15 to keep the illustration readable.
- **Removed the broken wildlife photos**: the two hot-linked images were failing to load; replaced with simple icon cards (🐐/🦌) that have no external dependency to break.
- **Hardened the GPS map**: `L.map()` can end up with a stale size if it initialises before its container's final layout (a common Leaflet gotcha, worsened by the now-removed images that used to shift the layout after load) — it now calls `invalidateSize()` and re-fits the track shortly after creation as a safety net.
- **Modernised the visual language**: a sticky nav with a blurred background and a shadow that appears once you scroll, sections that gently fade/slide into view on first scroll (with a fallback that reveals everything after 1.5s regardless, so the effect can never hide real content), lifted hover states on buttons, and visible focus rings for keyboard users.
- **Add-to-calendar button**: downloads a `.ics` file built from the hike's dates.
- **Share button**: uses the Web Share API on mobile, falls back to copying the link.
- **Print stylesheet**: printing the page (e.g. for a paper copy at the trailhead with no signal) hides the nav, buttons, gallery, and interactive controls, and shows a clean brief.
- Social link previews (Open Graph tags) and a mountain-emoji favicon, so the link looks right when shared in a group chat.

## Further ideas (site)

- **Offline / low-signal support**: a service worker caching the page shell, `hike.yaml`, and the GPX file so the brief still opens with no signal at the trailhead (the print stylesheet covers the "on paper" case, this would cover "on the phone, no bars").
- **Units toggle**: km/miles and °C/°F, for a mixed-nationality group.
- **Zoomable/pannable elevation chart**: the hand-rolled SVG profile is lightweight but fixed-scale; a small charting lib (or hand-written pan/zoom) would let hikers inspect specific sections of a longer route.
- **Structured data**: a JSON-LD `Event` block in `<head>` so the hike shows up with rich details (dates, location) if the link is ever indexed or pasted into calendar-aware apps.
- **Slider result as a share-friendly summary**: the Orga slider is per-visitor only by design now — if a group ever wants everyone to see the same shared headcount (not just their own guess), that's a small step back towards a shared backend (Supabase/MySQL, as explored on the other branches), with the same trade-offs documented there.

## Further ideas (content)

- **Bring back the safety acknowledgement, as information rather than a form**: removing the RSVP form also removed the mountain-responsibility text hikers used to read before joining (uneven terrain, altitude effects, limited phone coverage, etc.) — it had real value independent of RSVP and is worth re-adding as a plain notice somewhere on the page (e.g. near "Know the shape of the adventure" or as its own short section), even with nothing to click or sign.
- **Safety and emergency info**: nearest mountain refuge, park rescue number, and expected mobile coverage gaps along the route (relevant here — three of the four legs run well above 2,100 m).
- **Park regulations reminder**: Mercantour is a national park with rules worth stating up front — dogs are banned in the core zone, camping is restricted to designated areas/bivouac hours, and picking plants or disturbing wildlife is prohibited.
- **Sunrise/sunset and moon phase**: relevant for a "camp under stars" trip and easy to compute client-side (or pull from Open-Meteo's `sunrise`/`sunset` daily fields, already available from the same API call used for weather) — also useful for planning when to start the day-three descent before dark.
- **Refuge booking reminder**: Refuge de Nice and Refuge des Merveilles are staffed refuges that typically require advance booking in season — worth a note (and a booking link) since arriving without a reservation can mean no bed.
- **Link to official trail conditions**: a link to the Mercantour park's or Outdooractive's live trail-closure/conditions page, since alpine routes can close after storms or snow outside summer.

## AI note

The route intelligence is transparent local analysis rather than a paid generative-AI service. To add narrative AI coaching later, send the calculated stats to an API from a protected backend/serverless function—never put a provider key in this front-end source.
