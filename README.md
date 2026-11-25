# Sticky notes

A small DSH plugin that puts a Notes entry at the bottom of the sidebar and opens a floating board of sticky notes.

## Install

Open Plugins → Add plugin and enter:

```
@pemako/dsh-notes
```

Add `@<version>` after the name if you want to stay on a fixed release.

## What it does

Notes are Markdown. Headings, bold, italics, strikethrough, inline and fenced code, links, lists, task lists, quotes, and horizontal rules all work. Raw HTML shows up as text.

Every note carries a colour for urgency: red, amber, green, blue, or grey. Click the little pill on a card to change it. Drag the right edge, the bottom edge, or the corner to resize. On a phone the cards fill the width and only the height changes; a note created there remembers the phone width.

Active notes are grouped by the day you made them, archived ones by the day you archived them. The search box above the board looks through titles and bodies.

Edits save as you type, in the browser's localStorage under `dsh-notes.notes.v1`. Leave an empty draft and it gets dropped.

## Using it

Click Notes above Settings at the bottom of the sidebar, then New note. Double-click a card, or hit Edit, to write; Done leaves the editor. The colour pill sets urgency, the box icon archives, the trash icon deletes and asks for a second click within three seconds. The Archive tab lists archived notes by date, and the box icon there restores one.

## On a phone

When `dsh-web-mobile` is providing the drawer, opening the notes sheet closes the sidebar drawer so the sheet sits on top. The sheet is pinned to the viewport with 8px margins and stays above the drawer layers, so closing and reopening the drawer won't cover it or leave it unclickable. Swipes that start inside the sheet belong to the notes, because the mobile swipe layer yields on its `data-mobile-nav-dragging` mark, so resizing or scrolling a note doesn't open the drawer or the files panel.

## Things to know

Notes live in the browser profile that made them. They don't sync between browsers, devices, or DSH profiles, and disabling the plugin leaves them where they are.

Two GUI tabs open at once merge notes by id and prefer the newer copy. A note deleted in one tab can come back if the other tab still holds it.

If the browser refuses localStorage, the footer says the notes aren't saved and the console has the error. Anything unreadable gets copied to `dsh-notes.notes.v1.backup` before the next save.

Archived notes are read-only until you restore them.

Markdown tables, images, raw HTML, backslash escapes, and indented nested lists aren't supported.