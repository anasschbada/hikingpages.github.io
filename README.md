# Trail Brief

A no-build single-page hiking brief. The organizer can enter the weather and route briefing directly in the page. Hikers RSVP with a mountain-responsibility acknowledgement; the page calculates cars and tents from the group choices.

## Editing the hike

All organiser-controlled information lives in hike.yaml: title, description, weather, route details, and elevation profile. Load it from either YAML button in the site. To use a GPX track as the elevation profile after publishing, upload the GPX file next to the site and set route.gpx_url to its relative path, for example ./route.gpx.

## RSVP storage

This static version stores RSVP names only in the visitor's browser. GitHub Pages cannot provide a shared, secure attendee list by itself. For a collective-wide list, connect the RSVP form to a small backend such as Supabase or Firebase (both have free tiers), or use a Google Form for the RSVP while retaining this page for the hike brief. Do not treat the acknowledgement text as legal advice; have a local professional review it for organised commercial events.

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
- The RSVP list is still stored per-visitor in the browser (see "RSVP storage" above) — that limitation is unrelated to which host serves the page.
- To change the hike details (dates, weather, route stats), edit the `load({...})` object near the end of the `<script>` block in `wordpress-embed.html`, then re-paste the updated block into the WordPress page.

## Customise

Edit the hike date, meeting time, and kit reminder in `index.html`. The weather location can be set in the page itself. No API key is needed for Open-Meteo's public endpoint.

## AI note

The route intelligence is transparent local analysis rather than a paid generative-AI service. To add narrative AI coaching later, send the calculated stats to an API from a protected backend/serverless function—never put a provider key in this front-end source.
