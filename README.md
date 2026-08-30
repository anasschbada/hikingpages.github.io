# Trail Brief

A no-build single-page hiking brief. The organizer can enter the weather and route briefing directly in the page. Hikers RSVP with a mountain-responsibility acknowledgement; the page calculates cars and tents from the group choices.

## Editing the hike

All organiser-controlled information lives in `hike.yaml`: title, dates, weather fallback, route details, and elevation profile. The page fetches and parses it automatically on load (via [js-yaml](https://github.com/nodeca/js-yaml)) — just edit the file and refresh; no button or rebuild needed. If `hike.yaml` can't be fetched (for example when the page is pasted as a single WordPress block with no separate file), the site falls back to the same data hard-coded as `DEFAULT_DATA` at the bottom of `app.js`.

The elevation profile is drawn from `mercantour-route.gpx` automatically once the interactive map loads; to swap in a different hike, replace that GPX file (keep the same filename, or update the `fetch('./mercantour-route.gpx')` call in `app.js`).

The three "hiking stages" cards are computed directly from that GPX track rather than hard-coded: the track is split into as many segments as the hike has days (from `start_date`/`end_date`), each labelled with its real date, distance, and ascent/descent — recomputing the actual Mercantour track gives Day 1 as a 9.4 km, +1,163 m climb to the 2,688 m high point, Day 2 as a 9.4 km high-altitude traverse (staying above 2,150 m), and Day 3 as a 9.4 km, −1,177 m descent back to the trailhead.

Weather is fetched live from [Open-Meteo](https://open-meteo.com) (no API key needed) using `weather.lat` / `weather.lon` in `hike.yaml` and the hike's `start_date`/`end_date`, and replaces the organiser's manual `weather:` block once it loads — that manual block is what's shown as a fallback while the live forecast loads, or if it's unreachable, or if the dates are too far out for Open-Meteo's ~16-day range.

## Shared RSVP storage (Supabase)

By default the RSVP list is stored only in each visitor's own browser (`localStorage`), so nobody sees a shared attendee count. `app.js` can instead store RSVPs in a small free [Supabase](https://supabase.com) project, so every visitor sees the same list — with the local-browser storage kept automatically as an offline fallback if Supabase isn't configured or is unreachable.

To turn it on:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run:
   ```sql
   create table rsvps (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     created_at timestamptz not null default now()
   );
   alter table rsvps enable row level security;
   create policy "Anyone can read rsvps" on rsvps for select using (true);
   create policy "Anyone can add an rsvp" on rsvps for insert with check (true);
   ```
   This intentionally leaves out `update`/`delete` policies, so once submitted, an RSVP can't be edited or removed by a visitor from the page itself.
3. Open **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. In `app.js`, fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` near the top of the file with those two values.
5. Re-publish (on GitHub Pages, just push the updated `app.js`; for the WordPress embed, regenerate `wordpress-embed.html` — see below — and re-paste it).

Anyone with the page link can see the full attendee list, same as the current "Who's in" dashboard already shows to any visitor — the anon key is safe to expose client-side, it can only do what the two policies above allow. Do not put anything more sensitive than a name in this table. Do not treat the acknowledgement text as legal advice; have a local professional review it for organised commercial events.

## Organiser edit panel (optional)

With the Supabase table above already set up, you can also let the organiser edit the hike's title, dates, meeting time, weather location, and route stats directly from the page, instead of hand-editing `hike.yaml`:

1. In the same Supabase project, run:
   ```sql
   create table hike_data (
     id int primary key,
     data jsonb not null
   );
   alter table hike_data enable row level security;
   create policy "Anyone can read hike_data" on hike_data for select using (true);
   create policy "Anyone can write hike_data" on hike_data for insert with check (true);
   create policy "Anyone can update hike_data" on hike_data for update using (true);
   ```
2. Pick a passphrase and get its SHA-256 hex, e.g. in a browser console: `crypto.subtle.digest('SHA-256',new TextEncoder().encode('your passphrase')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))`.
3. Paste that hex string into `ADMIN_PASSPHRASE_HASH` near the top of `app.js`.
4. Re-publish. A small ✎ button appears in the nav; entering the passphrase there opens a form that saves straight to `hike_data` in Supabase, which every visitor's page then reads first (before falling back to `hike.yaml`, then to `DEFAULT_DATA`).

**This is a light deterrent, not real authentication.** The hash lives in this file's client-side source, and the `hike_data` table's row-level security allows any request carrying the public anon key to write to it — a visitor who reads the page's JavaScript could call the Supabase API directly and skip the passphrase prompt entirely. Only use this for low-stakes trip logistics you'd be fine with a determined visitor tampering with, never for anything sensitive. For real access control, replace this with Supabase Auth and an RLS policy scoped to an authenticated organiser account.

## Publish for free on GitHub Pages

1. Create a new GitHub repository and upload these three files to its root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
4. GitHub publishes it at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

For the shortest address, name the repository `YOUR-USERNAME.github.io`; GitHub Pages will publish it at `https://YOUR-USERNAME.github.io`. The `github.io` subdomain and HTTPS are free. A custom domain must be registered separately.

## Publish on WordPress (e.g. an OVHcloud WordPress hosting pack)

This is a self-contained, single-page design (no PHP, no build step), so the simplest way to bring it into WordPress is to paste it as a **Custom HTML block** on a page — no plugin required.

`wordpress-embed.html` in this repo is the ready-to-paste version: it inlines `styles.css`, `additions.css`, and `app.js` into one block, and embeds the GPX track data directly in the script (instead of fetching `mercantour-route.gpx` as a separate file), so nothing extra needs to be uploaded to the Media Library.

1. Log in to `wp-admin` on your OVHcloud WordPress hosting.
2. **Pages → Add new page**. Give it a title (e.g. "Mercantour").
3. If your theme offers a **blank / full-width / canvas** page template (no header, footer or sidebar), select it under **Page → Template** in the right-hand panel — this design already includes its own navigation, so the theme's header would otherwise show on top of it. Most popular themes (Astra, GeneratePress, OceanWP, Kadence…) offer this template for free.
4. Add a **Custom HTML** block (type `/html` and pick it), then paste the entire contents of `wordpress-embed.html` into it.
5. Publish the page. To make it the site's homepage, go to **Settings → Reading**, choose "A static page", and select it.

Notes:
- Pasting `<style>`/`<script>` tags into a Custom HTML block works out of the box for an **Administrator** account (WordPress grants the `unfiltered_html` capability to admins by default on a normal single-site install, which is what an OVH WordPress hosting pack gives you). If the tags get stripped, install a plugin such as "WPCode" (Insert Headers and Footers) and inject the same content there instead.
- Fonts, the Leaflet map, and OpenStreetMap tiles are loaded from public CDNs (Google Fonts, unpkg, OpenStreetMap) — this works the same on OVH hosting as it did on GitHub Pages, no extra setup needed.
- Set up shared RSVP storage and/or the organiser edit panel the same way as above (see "Shared RSVP storage" and "Organiser edit panel") by filling in `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`ADMIN_PASSPHRASE_HASH` inside `wordpress-embed.html`'s `<script>` block before pasting it in — otherwise RSVPs stay per-visitor, same limitation as on GitHub Pages.
- `wordpress-embed.html` doesn't fetch a separate `hike.yaml` (there's no extra file to host in a single pasted block) — it always uses the `DEFAULT_DATA` object near the end of the `<script>` block. To change the hike details (dates, weather, route stats), edit that object directly, then re-paste the updated block into the WordPress page. Live weather still works the same way, from `DEFAULT_DATA`'s `lat`/`lon`/dates.
- To regenerate `wordpress-embed.html` after editing `index.html`, `styles.css`, `additions.css`, `app.js` or the GPX file, ask Claude Code to rebuild it (it inlines the CSS/JS and embeds the GPX track as a JS string), or do it by hand: wrap `styles.css` + `additions.css` in one `<style>` tag, paste the page's body content, then add the CDN `<script src>` tags for js-yaml and Supabase followed by one `<script>` tag holding `app.js` with `fetch('./mercantour-route.gpx')` replaced by a `MERCANTOUR_GPX` template-literal constant.

## Customise

Edit the hike date, meeting time, and kit reminder in `hike.yaml` (or `index.html`/`DEFAULT_DATA` for text that isn't organiser-controlled yet). The weather location is set via `weather.lat`/`weather.lon` in `hike.yaml`; no API key is needed for Open-Meteo's public endpoint.

## What's already improved

- Live weather (Open-Meteo) and `hike.yaml` are now actually wired up — see "Editing the hike" above.
- The hiking-stage cards are recomputed directly from the real GPX track (real per-day distance/ascent/descent), instead of four arbitrary quarters with generic labels — see "Editing the hike" above.
- Optional shared RSVP storage via Supabase, with automatic fallback to the previous per-browser storage — see "Shared RSVP storage" above.
- Optional organiser edit panel to update hike details from the browser — see "Organiser edit panel" above.
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
- **Stronger organiser auth**: replace the passphrase-hash deterrent with real Supabase Auth once the group/edit surface grows beyond casual trip logistics (see the caveat in "Organiser edit panel").
- **Rate limiting on RSVP**: the honeypot stops simple bots; a Supabase Edge Function or database trigger capping inserts per IP/time window would handle a determined spammer if the link is ever shared publicly.

## Further ideas (content)

- **Safety and emergency info**: nearest mountain refuge, park rescue number (112 works throughout the EU/France for mountain rescue), and expected mobile coverage gaps along the route — currently only "limited phone coverage" is mentioned in the acknowledgement text, with no concrete numbers.
- **Park regulations reminder**: Mercantour is a national park with rules worth stating up front — dogs are banned in the core zone, camping is restricted to designated areas/bivouac hours, and picking plants or disturbing wildlife is prohibited.
- **Sunrise/sunset and moon phase**: relevant for a "camp under stars" trip and easy to compute client-side (or pull from Open-Meteo's `sunrise`/`sunset` daily fields, already available from the same API call used for weather) — also useful for planning when to start the day-three descent before dark.
- **Interactive packing checklist**: turn the one-line kit reminder into a checkable list (stored per-visitor like the settings), so each hiker can tick off water, layers, headlamp, etc.
- **Carpool/parking coordination**: the page already computes cars needed from group size; adding a simple "who's driving / who needs a seat" field per RSVP would close the loop on the actual logistics problem it's solving for.
- **Link to official trail conditions**: a link to the Mercantour park's or Outdooractive's live trail-closure/conditions page, since alpine routes can close after storms or snow outside summer.

## AI note

The route intelligence is transparent local analysis rather than a paid generative-AI service. To add narrative AI coaching later, send the calculated stats to an API from a protected backend/serverless function—never put a provider key in this front-end source.
