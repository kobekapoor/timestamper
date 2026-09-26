# Timestamper

Put timestamp markers in a note and see them on the right side of the page as you scroll, so you know what time you should be at while reading aloud.

## Usage

Add a marker anywhere on a line:

```md
Welcome everyone, thanks for coming tonight. %%@0:00%%

Let's start with the first story. %%@1:30%%

This is the halfway point. %%@12:45%%
```

Markers use `m:ss` or `h:mm:ss`. They are written as Obsidian comments (`%%…%%`), so they stay invisible in exports and other Markdown apps.

- **Live preview / source mode:** the time shows to the right of the line. In live preview, the raw marker text is hidden unless your cursor is on that line.
- **Reading view:** the time shows to the right of the paragraph (or list/block) containing the marker.

## Commands

- **Insert timestamp marker** — prompts for a time (prefilled with the previous marker) and appends it to the current line. Assign a hotkey in **Settings → Hotkeys** for quick use.
- **Remove all timestamp markers from this note**

## Settings

- **Marker style**: *Badge* shows a small label beside each marked line. *Ribbon* draws a strip down the right side of the whole note (only on notes that contain markers), with the times on it.
- **Background colour / Text colour**: set separately for each style. Use the reset button to go back to your theme's colours.
- **Font**: *Monospace* (default), your theme's *Interface font* or *Text font*, or *Custom* (type the name of any installed font).
- **Badge placement** (badge only): *Right margin* (outside the text column; best with **Readable line length** on) or *Right edge of text*.
- **Hide marker text while editing**: toggle hiding the raw `%%@…%%` text in live preview.

## Development

```bash
npm install
npm run dev
```

Build for release with `npm run build`, then copy `main.js`, `manifest.json`, and `styles.css` into `<Vault>/.obsidian/plugins/timestamper/`.

This plugin makes no network requests and stores nothing beyond its settings.
