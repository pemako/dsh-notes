# Sticky notes

A DSH web plugin that adds a **Notes** entry at the sidebar foot and opens a
floating notes board.

## Install

Install it from npm in **Plugins → Add plugin**:

```
@pemako/dsh-notes
```

Pin a version instead when you want a fixed one, e.g. `@pemako/dsh-notes@0.1.0`.

- **Markdown:** headings, bold, italic, strikethrough, inline code, fenced code,
  links, lists, task lists, blockquotes, and horizontal rules. Raw HTML is
  shown as text, not rendered.
- **Resize:** drag a note's right edge, bottom edge, or lower-right corner to
  change its width and height. The lower-right corner is also a focusable
  control: focus it and press the arrow keys (Shift for larger steps). On
  phone-width screens (up to 640px), notes fill the board width and only
  height resizing applies; new notes store that phone width.
- **Urgency colors:** every note carries one of five colors — urgent (red),
  important (amber), normal (green), info (blue), low (gray). Click the urgency
  pill on a note to switch colors.
- **Archive by date:** active notes are grouped by creation day, archived notes
  by archive day. The panel also has a search field across titles and bodies.
- **Autosave:** edits persist as you type; notes are stored in this browser's
  `localStorage` under `dsh-notes.notes.v1`. An empty draft is discarded when
  you leave it.

## Use

1. Click **便签 / Notes** above Settings at the sidebar foot.
2. Click **新建便签 / New note**, write a title and Markdown body.
3. Double-click a note (or use **编辑**) to edit; **完成** leaves edit mode.
4. Use the colored urgency pill to pick a color, the box icon to archive, and
   the trash icon (twice, within three seconds) to delete.
5. Open the **归档 / Archive** tab to browse notes archived by date; restore
   one with the box icon.

## Mobile

On touch layouts where `dsh-web-mobile` provides the drawer:

- Opening the notes sheet closes the sidebar drawer, so the sheet is the top
  surface instead of sitting behind the drawer.
- The sheet is pinned to the viewport (8px margins) and sits above the mobile
  drawer layers, so closing/reopening the drawer cannot leave it covered or
  unclickable.
- Swipes that start inside the sheet belong to the notes (the mobile swipe
  layer yields on its `data-mobile-nav-dragging` cooperation mark), so resizing
  or scrolling notes does not open the drawer or files panel.

## Limitations

- Notes live in the browser profile that created them; they are not synced
  across browsers, devices, or DSH profiles. Disabling the plugin leaves the
  stored notes in place.
- Two open GUI tabs merge their notes by id and prefer the newer copy. A note
  deleted in one tab can reappear when the other tab still holds it.
- If the browser refuses `localStorage`, the panel footer says the notes are
  not saved, and the console logs the failure. Unreadable stored data is copied
  to `dsh-notes.notes.v1.backup` before the next save.
- Archived notes are read-only until restored.
- Markdown tables, images, raw HTML, backslash escapes, and nested list
  indentation are not supported.