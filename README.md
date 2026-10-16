# VetRx prescription writer

A lightweight, browser-based veterinary prescription writer designed around a customizable veterinary prescription pad.

## Features

- Fast prescription entry with editable medicine rows.
- Medicine autocomplete after typing the first two letters.
- Reusable medicine database stored in the browser's `localStorage`.
- Dosage, route, frequency, and duration defaults from the medicine database.
- Print-ready A4 layout. Use **Print / Save PDF** and choose **Save as PDF** in the browser dialog.
- Patient details, report fields, clinical signs, and advice fields modeled after the supplied pad.

## Run

Open `index.html` directly in a browser, or serve the folder with any static web server:

```bash
python3 -m http.server
```

Then visit `http://localhost:8000`.

The medicine database is personal to the browser and device. Export/import and multi-device sync can be added later if needed.
