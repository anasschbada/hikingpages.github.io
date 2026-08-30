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

## Customise

Edit the hike date, meeting time, and kit reminder in `index.html`. The weather location can be set in the page itself. No API key is needed for Open-Meteo's public endpoint.

## AI note

The route intelligence is transparent local analysis rather than a paid generative-AI service. To add narrative AI coaching later, send the calculated stats to an API from a protected backend/serverless function—never put a provider key in this front-end source.
