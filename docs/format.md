<div align="center">
  <a href="../README.md"><img src="../markdown-to-wattpad.svg" alt="Markdown to Wattpad" width="420"></a>
</div>

# The format

This document lists every rule that the converter follows, and the evidence
behind each one.
The rules are not a guess at what Wattpad likes.
They copy the layout of the published story that this tool was made for, and
they were measured against its 345 published parts.

## What Wattpad stores

Wattpad serves the text of a part as a list of paragraphs.
This is one of them, as the public text endpoint returns it:

```html
<p data-p-id="292ad2cd0162a9a6a5d5610a6c4b03d5" style="text-align:left;">
  <b>NES</b>: There's some left.<br><b>BRR</b>: Thanks.
</p>
```

- Each paragraph is one `<p>`.
- Its alignment is a `style` attribute: `text-align:center;`, `left`, or
  `right`. A paragraph with no style is on the left.
- Inside it there are only `<b>`, `<i>`, `<u>`, and `<br>`. Older parts also
  hold `<strong>` and `<em>`, which mean the same.
- `data-p-id` is Wattpad's own name for the paragraph. Wattpad adds it when it
  saves, so the converter leaves it out.

The converter writes exactly this markup, and nothing more.
Its output for the example above is:

```html
<p style="text-align:left;"><b>NES</b>: There's some left.<br><b>BRR</b>: Thanks.</p>
```

## The rules

### The title

The first line of the chapter, when it is a heading, is the part title.
Wattpad keeps the title in a box above the text, so the converter shows it
apart, with its own copy button, and leaves it out of the text.
When the chapter has no heading at the top, front matter with a `title:` key
fills the title instead.

### Paragraphs and line breaks

A blank line starts a new paragraph.
A single line break stays a line break, as `<br>` inside the paragraph.

This is not how CommonMark reads a line break.
CommonMark joins the lines of a paragraph into one run of text.
Dialogue in this format is one speaker to a line, and joining those lines
would put three speakers into one sentence.

### Narration

Narration is centred: `text-align:center;`.
In the published parts, 8614 of the 8630 narration paragraphs are centred.
The other 16 were aligned by hand.

### Dialogue

A line of dialogue starts with a speaker label and a colon:

```markdown
**NES**: There's some left.
**JHN?:** See how easy it is?
MSTR: Name.
```

- The label is bold in the output, also when the Markdown leaves it plain.
  A plain label must be written in capitals, digits, and the marks `? # / & '
  . -`, in at most four words and 24 characters, so that "Note: the door" is
  not dialogue.
- Dialogue is aligned left.
- A run of dialogue lines is one paragraph, with `<br>` between the speakers,
  also when the Markdown puts a blank line between them. The switch "Join
  dialogue lines into one block" turns the joining off.
- A line with no label after a line of dialogue stays in the block. The
  published parts keep both kinds there: the rest of a long line that wrapped,
  and a short action between two speakers.
- Each line of dialogue is read alone, so an asterisk that one speaker leaves
  open does not put the next speaker in italics.

### The chapter ending

A chapter ends with its number and its name, and a closing thought:

```markdown
***End of Chapter 344***

***"She Never Asked"***

[ Absolution is a conversation. ]
```

- "End of Chapter" and the name become one centred paragraph of two lines, in
  bold italic, underlined.
- "End of Volume", "End of Part", "End of Book", "End of Act", "End of Arc",
  "End of Season", "End of Prologue", "End of Epilogue", and "End of
  Interlude" work the same way. A chapter that closes a volume has two such
  blocks.
- The name can sit on the next line, in the next paragraph, or on the same
  line as the ending.
- The closing thought in square brackets becomes one centred paragraph in
  bold. It can span several Markdown paragraphs. Each of them becomes one line
  of the output paragraph.
- A plain line that says "End of Chapter 12" and nothing more counts as an
  ending. A longer plain line, such as "End of chapter meetings were tense.",
  does not.
- Only this block is underlined. Other lines in bold italic, such as an
  epigraph, are not underlined in any published part.

The switch "Style the chapter ending" turns all of this off, and the lines
then convert like any other text.

### Emphasis

- `**bold**` and `__bold__` give `<b>`.
- `*italic*` and `_italic_` give `<i>`.
- `<u>underline</u>` gives `<u>`. Markdown has no underline, and Wattpad does.
  `<b>`, `<strong>`, `<i>`, and `<em>` work as well.
- The tags always nest in the order that Wattpad writes them: bold, then
  italic, then underline.

### Broken marks

Many tools that export a document to Markdown copy the space at the edge of
an italic run inside the marks, so `<i>Wouldn't anyone? </i>Still` becomes
`*Wouldn't anyone? *Still`.
CommonMark will not close a run on a mark with a space before it, and the
reader sees the asterisks.

When a paragraph comes out with asterisks still in it, the converter tries
three repairs, one after another:

1. It removes an empty bold run, `** **`.
2. It moves a space from inside a pair of marks to outside it.
3. It joins two italic runs that were written side by side, as in
   `*One. **Two.*`.

It keeps a repair only when the result shows no asterisks at all.
A repair that removes some of them and leaves others is a guess, and the
original shows the writer what went wrong.

In the chapter ending, where every line is set in one style from end to end,
the marks carry no meaning, so the converter removes all of them.

### Scene breaks

A line of three or more `-`, `*`, or `_`, with or without spaces between
them, is a scene break.
It becomes a centred paragraph with the characters as you typed them.
The published parts use `---`.

### What Wattpad cannot hold

| Markdown | What Wattpad gets |
| -------- | ----------------- |
| A heading after the first line | A centred paragraph in bold |
| A list | The lines as you typed them, markers included |
| A quote | Its paragraphs, without the `>` |
| A link | Its text. The page says how many addresses were lost |
| A picture | Nothing. The page names it, so you can upload it in the writer |
| `~~strikethrough~~` | The text. The page says so |
| Code | Plain text. The page says so |
| Other HTML | The tag stays as visible text. The page says so |
| A comment `<!-- -->` | Nothing |

A single tilde is text, not strikethrough, because fiction uses it in lines
such as "Hey~ what's up~".

Leading spaces mean nothing, so a paragraph indented by four spaces is text
and not code.
A line that starts with `-`, `*`, `+`, or a number stays text, so an
attribution such as "- Jess Kalm" keeps its dash, and a sentence that starts
with "1990." stays a sentence.

The page also counts em dashes, because Wattpad's help centre says that an
em dash can turn into a hyphen when a story is published.

## How the rules were checked

The published story has 345 parts.
The public text endpoint of Wattpad returns the markup of each one.
Two sets of Markdown were converted and compared with that markup, paragraph
by paragraph, after both sides were reduced to the same form: the alignment,
and the text of each line with its bold, italic, and underline.

| Markdown | Parts | Paragraphs | Same as Wattpad | Parts with no difference |
| -------- | ----- | ---------- | --------------- | ------------------------ |
| The writer's own drafts of parts 1 to 243 | 247 | 10164 | 9975, or 98.14% | 178 |
| Every part, downloaded from Wattpad as Markdown and converted back | 345 | 13201 | 13100, or 99.23% | 293 |

The second row is a round trip.
The download keeps bold and italics and loses the alignment and the
underline, so every centred paragraph and every underline in that row was put
back by the rules above.

The differences that remain are of four kinds:

- **Layout done by hand in the Wattpad writer.** Some narration paragraphs are
  on the left, some dialogue blocks are split in two, and some parts join
  narration paragraphs with a line break. No rule can know about a choice
  that was made after the Markdown was written.
- **Formatting that differs between parts.** A few closing thoughts are not
  bold, a few speaker labels are not bold, and a few endings miss the italic.
- **Asterisks that Wattpad itself shows.** 21 published parts show
  asterisks to their readers. In two of them a word was pasted with its
  Markdown marks, so readers see `*perforate*`, and the converter puts the
  italics there instead. This is the fault that the tool exists to prevent.
  In the other 19, all early parts, the stage directions inside dialogue show
  their asterisks.
- **Marks that no repair can place,** in a few early drafts that an older
  converter damaged. Wattpad shows stray asterisks in the same places. The
  page lists every such paragraph under the preview.

The comparison reads the writer's files, so it is not part of the test suite.
The test suite builds every case it needs inside the test, with text written
for the test. See [AGENTS.md](../AGENTS.md), "What a test can hold on to".

## What a paste keeps

The browser test copies a chapter with the button, reads the clipboard back,
and pastes it into an editable box in Chromium.
The clipboard holds the markup above, whole, and a plain text copy with a
blank line between paragraphs.
The paste keeps every paragraph, the bold, the italics, the underline, and
the centred alignment.

The browser drops `text-align:left;` from the pasted paragraphs, because left
is where a paragraph sits already.
The dialogue therefore arrives with no alignment of its own, which is the
left.
The published story shows both forms: 469 dialogue paragraphs carry
`text-align:left;` and 3405 carry no style.

The Wattpad writer is only open to a signed in account, so no test here can
paste into it.
Wattpad's help centre warns that a paste from another source may lose its
alignment, and advises a paste on the website rather than in the app.
The page repeats that advice, and asks the writer to look at the alignment
before publishing.
