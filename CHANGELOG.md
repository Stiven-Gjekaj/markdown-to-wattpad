<div align="center">
  <a href="README.md"><img src="markdown-to-wattpad.svg" alt="Markdown to Wattpad" width="420"></a>
</div>

# Changelog

All notable changes to Markdown to Wattpad are recorded here.
The format is based on Keep a Changelog (https://keepachangelog.com), and the
project aims to follow semantic versioning.

A commit carries no version prefix and changes no version.
A version moves only when something is released.

## Unreleased

### The first version

A page that turns a chapter written in Markdown into text for the Wattpad
writer, with the bold, the italics, the underline, and the alignment already
in place.

**Added**

- **The converter**, in `src/convert/`. It copies the layout of a published
  Wattpad story: centred narration, dialogue in one block on the left with the
  speaker labels in bold, and a chapter ending that is underlined, with a
  closing thought in bold. [docs/format.md](docs/format.md) lists every rule.
- **Measured against 345 published parts.** Converted back from Markdown,
  13100 of their 13201 paragraphs match what Wattpad serves, and 293 parts
  match with no difference at all. The rest is layout done by hand in the
  Wattpad writer, and the format document names each kind.
- **Repairs to broken marks.** A tool that puts the space inside an italic
  run, as in `*Wouldn't anyone? *Still`, leaves asterisks that CommonMark
  cannot close. The converter mends three shapes of this, and keeps a repair
  only when no asterisk is left.
- **Notices under the preview** for what Wattpad cannot hold: pictures,
  links, strikethrough, code, HTML, em dashes, and any paragraph that would
  show asterisks to a reader.
- **Three copy buttons.** The text goes on the clipboard as Wattpad markup
  and as plain text at once. The title has its own button, because Wattpad
  keeps it in a box of its own. A copy made by hand from the preview is
  cleaned the same way.
- **Four layout switches**: centred narration, joined dialogue, bold speaker
  labels, and the styled ending.
- **The draft and the switches stay in the browser** across a reload. Nothing
  leaves the device.
- **98 unit tests and 15 browser tests.** The browser tests copy with the
  button, read the clipboard back, and paste into an editable box.
- **CI, CodeQL, and a deployment to GitHub Pages.**

**Decided**

- **A single line break stays a line break.** CommonMark joins the lines of a
  paragraph. Dialogue is one speaker to a line, and joining would destroy it.
- **Lists and indented paragraphs stay text.** CommonMark turns "- Jess Kalm"
  under an epigraph into a bullet, and a paragraph indented by four spaces
  into code.
- **A single tilde is text.** Only `~~two~~` is strikethrough, because fiction
  writes "Hey~ what's up~".
- **No paste into the Wattpad writer is tested.** It is open only to a signed
  in account. Wattpad's help centre warns that a paste can lose its
  alignment, so the page asks the writer to check before publishing.
