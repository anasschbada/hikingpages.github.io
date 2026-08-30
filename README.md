# Trail Brief

A no-build single-page hiking brief. The organizer can enter the weather and route briefing directly in the page. Hikers RSVP with a mountain-responsibility acknowledgement; the page calculates cars and tents from the group choices.

## Editing the hike

All organiser-controlled information lives in `hike.yaml`: title, dates, weather fallback, route details, and elevation profile. The page fetches and parses it automatically on load (via [js-yaml](https://github.com/nodeca/js-yaml)) — just edit the file and refresh; no button or rebuild needed. If `hike.yaml` can't be fetched (for example when the page is pasted as a single WordPress block with no separate file), the site falls back to the same data hard-coded as `DEFAULT_DATA` at the bottom of `app.js`.

The elevation profile is drawn from `mercantour-route.gpx` automatically once the interactive map loads; to swap in a different hike, replace that GPX file (keep the same filename, or update the `fetch('./mercantour-route.gpx')` call in `app.js`).

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
- Set up shared RSVP storage the same way as above (see "Shared RSVP storage") by filling in `SUPABASE_URL`/`SUPABASE_ANON_KEY` inside `wordpress-embed.html`'s `<script>` block before pasting it in — otherwise RSVPs stay per-visitor, same limitation as on GitHub Pages.
- `wordpress-embed.html` doesn't fetch a separate `hike.yaml` (there's no extra file to host in a single pasted block) — it always uses the `DEFAULT_DATA` object near the end of the `<script>` block. To change the hike details (dates, weather, route stats), edit that object directly, then re-paste the updated block into the WordPress page. Live weather still works the same way, from `DEFAULT_DATA`'s `lat`/`lon`/dates.
- To regenerate `wordpress-embed.html` after editing `index.html`, `styles.css`, `additions.css`, `app.js` or the GPX file, ask Claude Code to rebuild it (it inlines the CSS/JS and embeds the GPX track as a JS string), or do it by hand: wrap `styles.css` + `additions.css` in one `<style>` tag, paste the page's body content, then add the CDN `<script src>` tags for js-yaml and Supabase followed by one `<script>` tag holding `app.js` with `fetch('./mercantour-route.gpx')` replaced by a `MERCANTOUR_GPX` template-literal constant.

## Customise

Edit the hike date, meeting time, and kit reminder in `hike.yaml` (or `index.html`/`DEFAULT_DATA` for text that isn't organiser-controlled yet). The weather location is set via `weather.lat`/`weather.lon` in `hike.yaml`; no API key is needed for Open-Meteo's public endpoint.

## What's already improved

- Live weather (Open-Meteo) and `hike.yaml` are now actually wired up — see "Editing the hike" above.
- Optional shared RSVP storage via Supabase, with automatic fallback to the previous per-browser storage — see "Shared RSVP storage" above.
- Social link previews (Open Graph tags) and a mountain-emoji favicon, so the link looks right when shared in a group chat.
- Keyboard focus moves into the RSVP/settings dialogs when they open, and the `<html lang>` attribute follows the EN/FR toggle.
- An "Export CSV" button in the organisation dashboard, so the organiser can download the attendee list.
- Gallery images use `loading="lazy"`, and the RSVP submit button disables itself with a "Saving…" state and a clear error message if the save fails, instead of silently doing nothing.

## Further ideas (not yet implemented)

- **Full bilingual coverage**: the EN/FR toggle currently only switches the about/wildlife text; the nav, weather card, stats labels and dialogs stay in English.
- **Add-to-calendar button**: generate a downloadable `.ics` file from `hike.yaml`'s dates so hikers can add the trip to their calendar in one tap.
- **Share button**: a "Share this hike" button using the Web Share API (falls back to copy-link) for easier forwarding on mobile.
- **Spam protection on RSVP**: if the link is shared publicly, consider a lightweight honeypot field or rate limit on the Supabase `insert` policy to deter abuse.
- **Self-hosted gallery images**: the wildlife photos are hot-linked from external sites; hosting your own resized copies would be more reliable and faster.
- **Printable packing list / brief**: a print stylesheet (`@media print`) so hikers can print a paper copy of the essentials before losing signal.
- **Accessibility pass**: run an automated audit (e.g. axe or Lighthouse) for color-contrast and screen-reader labelling on the icon-only buttons (⚙, ▲, etc.).
- **Organiser edit UI**: a small password-protected form to edit `hike.yaml` fields from the browser instead of hand-editing YAML, for a fully non-technical organiser.

## AI note

The route intelligence is transparent local analysis rather than a paid generative-AI service. To add narrative AI coaching later, send the calculated stats to an API from a protected backend/serverless function—never put a provider key in this front-end source.
