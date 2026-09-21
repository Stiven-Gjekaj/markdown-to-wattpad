<div align="center">

![Markdown to Wattpad](markdown-to-wattpad.svg)

### Markdown in. Wattpad out.

_Paste a chapter. Copy it into the Wattpad writer with the formatting already in place._

[![CI](https://img.shields.io/github/actions/workflow/status/Stiven-Gjekaj/markdown-to-wattpad/ci.yml?branch=main&style=for-the-badge&label=ci&labelColor=14110e&logo=githubactions&logoColor=white)](https://github.com/Stiven-Gjekaj/markdown-to-wattpad/actions/workflows/ci.yml)
[![Pages](https://img.shields.io/github/actions/workflow/status/Stiven-Gjekaj/markdown-to-wattpad/deploy.yml?branch=main&style=for-the-badge&label=pages&labelColor=14110e&logo=githubpages&logoColor=white)](https://github.com/Stiven-Gjekaj/markdown-to-wattpad/actions/workflows/deploy.yml)
![TypeScript](https://img.shields.io/badge/typescript-ff7a3d?style=for-the-badge&logo=typescript&logoColor=14110e)
![Astro](https://img.shields.io/badge/astro-ff9a4f?style=for-the-badge&logo=astro&logoColor=14110e)
[![MIT licence](https://img.shields.io/badge/mit_licence-ffc46b?style=for-the-badge&logoColor=14110e)](LICENSE)

<p align="center">
  <a href="https://stiven-gjekaj.github.io/markdown-to-wattpad/"><b>Use it in your browser</b></a> |
  <a href="#what-changes"><b>What changes</b></a> |
  <a href="#paste-it-into-wattpad"><b>Paste it</b></a> |
  <a href="#how-it-works"><b>How it works</b></a> |
  <a href="#project-structure"><b>Structure</b></a>
</p>

</div>

---

## Overview

**Markdown to Wattpad** turns a chapter written in Markdown into text that you
paste into the Wattpad writer.
The bold, the italics, the underline, and the alignment arrive with it, and
no asterisk reaches your readers.

Wattpad does not read Markdown.
Paste a chapter straight in and every reader sees `*this*` instead of _this_.
Two published parts of the story that this tool was made for show exactly
that to their readers today.

The page runs in your browser.
Your chapter stays on your device, because there is no server to send it to.

---

## What changes

The converter copies the layout of a published Wattpad story, and it was
checked against all 345 of its parts.
[docs/format.md](docs/format.md) lists every rule and the evidence behind it.

<table>
<tr>
<td width="50%" valign="top">

### You write

```markdown
# (Chapter 12 || Volume 2) The Lamp.

The rain had stopped by the time
Mara reached the mill.

**MAR**: You came.

**TOM**: I said I would.

---

***End of Chapter 12***

***"The Lamp"***

[ Some promises are kept by showing up. ]
```

</td>
<td width="50%" valign="top">

### Wattpad gets

- **The title** in its own box, not in the text.
- **Narration** centred. A single line break stays a line break.
- **Dialogue** as one block on the left, the speaker labels in bold, one
  speaker to a line, with or without blank lines between them.
- **The scene break** as you typed it, centred.
- **The ending** as one centred paragraph of two lines, in bold italic,
  underlined.
- **The closing thought** in bold, as one paragraph, even when it spans
  several.

</td>
</tr>
</table>

Four switches under the preview turn the layout rules on and off: centred
narration, joined dialogue, bold speaker labels, and the styled ending.

### What it will not do

Wattpad keeps paragraphs, bold, italics, underline, and alignment, and
nothing else.
A heading after the first line becomes a bold paragraph.
A list keeps its markers as text.
A link keeps its words and loses its address.
A picture is left out, because Wattpad takes a picture only as an upload.
The page tells you, under the preview, each time it does one of these.

It also tells you when a paragraph would still show asterisks, because a bold
or italic mark has no partner.
Tools that export a document to Markdown often write `*Wouldn't anyone? *Still`,
with the space inside the marks, which CommonMark cannot close.
The converter mends the common shapes of this, and only keeps a repair that
leaves no asterisk behind.

---

## Paste it into Wattpad

1. Open the part in the Wattpad writer, on the website. Wattpad says that a
   paste in its phone app loses more formatting.
2. Press **Copy title**, click the title box, and paste.
3. Press **Copy text for Wattpad**, click into the story text, and paste.
4. Look at the alignment before you publish. Wattpad's help centre warns that
   a paste does not always keep it.

The text goes on the clipboard in the markup that Wattpad itself stores, and
as plain text at the same time, for an editor that reads no HTML.

---

## How it works

**The browser does the work. No text goes to a server.**

```
your Markdown
  -> front matter, line endings, and comments are removed
  -> the lines are cut into paragraphs, headings, scene breaks, and code
  -> the chapter ending is found and set apart
  -> each paragraph is split into narration and dialogue
  -> marked reads the bold and the italics into runs of text
  -> broken marks are mended, when a repair leaves no asterisk
  -> the runs are written as <p>, <b>, <i>, <u>, and <br>
  -> the clipboard receives that markup, and the same text without it
```

| Layer | Choice |
| ----- | ------ |
| Page | Astro, one static page, and one script |
| Language | TypeScript, strict mode |
| Markdown | `marked` for the inline marks only. The block rules are this project's own, because CommonMark's lists and indented code do not suit prose |
| Styles | Hand-written CSS on a token palette, light and dark |
| Tests | Vitest for the converter in Node, Playwright for the page in Chromium |
| Host | GitHub Pages, deployed by a workflow |

The page sends one script of 62 KB, or 20 KB compressed, and one stylesheet
of 9 KB.
It makes no request to another host, and a browser test fails if it does.

---

## Project structure

**The converter is pure.**
`src/convert/` takes a string and returns the paragraphs, the markup, the
plain text, and the notices.
It touches no browser API, so the unit tests run it in Node.

**The page is thin.**
`src/scripts/app.ts` converts the whole chapter again on each keystroke.
A long chapter converts in a few milliseconds, so there is no cache to keep
in step with the text.

| Area | Files | Lines | Responsibility |
| ---- | ----- | ----- | -------------- |
| **Converter** | `src/convert/` | 1344 | Blocks, dialogue, runs, repairs, the ending, the markup, the notices |
| **Page script** | `src/scripts/` | 416 | The preview, the clipboard, the draft, a clean copy by hand |
| **Words** | `src/ui/` | 89 | The notices in plain words, and the example chapter |
| **Page** | `src/pages/`, `src/layouts/` | 292 | The markup, and the examples built from the converter |
| **Styles** | `src/styles/global.css` | 740 | The palette, the layout, light and dark |
| **Total** | **18 files** | **2881** | Not counting 1289 lines of tests |

```
src/
  convert/
    source.ts      line endings, front matter, comments
    blocks.ts      paragraphs, headings, scene breaks, code
    speaker.ts     finds a line of dialogue
    runs.ts        reads bold, italic, and underline with marked
    mend.ts        repairs marks that an export broke
    ending.ts      the chapter ending and the closing thought
    paragraphs.ts  narration, dialogue, and the joined blocks
    wattpad.ts     writes the markup that Wattpad stores
    index.ts       convert(), the options, the notices
  scripts/         the page: preview, clipboard, storage, selection
  ui/              the words of the notices, the example chapter
  pages/           the one page
tests/e2e/         the browser tests
scripts/
  serve-dist.mjs   serves dist/ the way GitHub Pages does
  check-links.sh   checks every relative link in the documentation
```

---

## Testing

**The converter, in Node.**

```
pnpm test
```

99 tests across 10 files.
Each one writes the Markdown it needs inside the test.

**The page, in a browser.**

```
pnpm build
pnpm test:e2e
```

15 tests across 2 files, 24 runs in all: every test runs in a desktop and a
phone viewport, apart from the clipboard tests, which run on the desktop.
They copy with the buttons, read the clipboard back, and paste into an
editable box to see what an editor receives.
They also fail if the page makes a request to any host but its own.

The build is not optional.
The tests drive the built site in `dist/`, because that is what a visitor
gets.
The first run needs a browser:

```
pnpm exec playwright install chromium
```

`pnpm verify` runs the lint, the type check, the unit tests, and the build.

---

## Deployment

A push to `main` builds the site and publishes it to GitHub Pages.
The workflow is [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

It checks two things before it publishes, because both failures are silent:

- The built page must hold the `/markdown-to-wattpad/` asset path. A wrong
  base still builds, and then every asset on the live site is a 404.
- `dist/.nojekyll` must exist. Without it GitHub Pages runs Jekyll, which
  drops the `_astro` directory.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), follow the
[Code of Conduct](CODE_OF_CONDUCT.md), and read [SUPPORT.md](SUPPORT.md) if you
need help.
[AGENTS.md](AGENTS.md) sets the rules for commits and for writing.
The [changelog](CHANGELOG.md) records what changed.

---

## License

Released under the MIT License.
See [LICENSE](LICENSE) for the full text, and [TERMS.md](TERMS.md) for the
project terms.

The Markdown reading uses [marked](https://github.com/markedjs/marked), under
the MIT License.
Wattpad is a trademark of its owner. This project is not made by Wattpad and
has no connection with it.

<div align="center">
<sub>Your chapter stays on your device. <a href="https://stiven-gjekaj.github.io/markdown-to-wattpad/">Try it</a>.</sub>
</div>
