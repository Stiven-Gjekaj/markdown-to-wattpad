<div align="center">
  <a href="README.md"><img src="markdown-to-wattpad.svg" alt="Markdown to Wattpad" width="420"></a>
</div>

# Contributing to Markdown to Wattpad

Thanks for your interest in Markdown to Wattpad, a page that turns a chapter
written in Markdown into text for the Wattpad writer.
Contributions of all kinds are welcome: bug reports, a chapter that converts
badly, documentation fixes, and arguments against a rule that is already made.

## Ways to contribute

- Report a chapter that converts badly. Attach the smallest piece of Markdown
  that shows the problem, and say what Wattpad should get.
- Report a paste into Wattpad that loses something the preview shows. Say
  which browser you used.
- Propose a rule for a layout that the converter does not know yet.
- Improve the page: the preview, the copy flow, or the phone layout.

Before you start significant work, open an issue to agree on the approach.
This costs you one message and can save you a rewritten pull request.

## Development setup

You need Node 24 and pnpm.

    git clone https://github.com/Stiven-Gjekaj/markdown-to-wattpad
    cd markdown-to-wattpad
    pnpm install
    pnpm dev

`pnpm verify` runs the lint, the type check, the unit tests, and the build.

## Where a change lives

| Change | Files |
| ------ | ----- |
| Reading the Markdown: front matter, blocks | `src/convert/source.ts`, `src/convert/blocks.ts` |
| Dialogue and speaker labels | `src/convert/speaker.ts`, `src/convert/paragraphs.ts` |
| Bold, italic, underline, and repairs to broken marks | `src/convert/runs.ts`, `src/convert/mend.ts` |
| The chapter ending | `src/convert/ending.ts` |
| The markup that Wattpad receives | `src/convert/wattpad.ts` |
| The notices under the preview | `src/convert/index.ts`, `src/ui/messages.ts` |
| The page and its controls | `src/pages/index.astro`, `src/scripts/` |
| The look | `src/styles/global.css` |
| A rule, or the evidence for one | `docs/format.md` |

## The rules that catch people

[`AGENTS.md`](AGENTS.md) is the full set. These four cause the most rework.

- **One change per commit, and a feature is many commits.** A commit that says
  "integrate the full feature" is wrong even when the code is right. Split it
  into the steps that a reviewer can read and revert one at a time.
- **Code and its tests go in one commit. Documentation goes in its own.**
- **All text uses Simplified Technical English.** Short sentences, active voice,
  present tense. No em-dashes and no emoji, in source, comments, documentation,
  commit messages, or pull requests.
- **A test builds its own state.** Write the Markdown that a test needs inside
  the test. Never read a chapter out of a file that a writer edits, because the
  writer changes it and the test then fails for a reason that has nothing to do
  with the code.

## Two traps that the design creates

**A test can pass for the wrong reason.**
A test that checks that a line is not changed passes as well when the code
never looked at the line.
Break the code on purpose and watch the test fail before you trust it.
The browser test for an empty selection was written twice for this reason:
the first version passed with the fix removed.

**The browser changes what it pastes.**
A paste into an editable box drops `text-align:left;`, because left is the
default.
A test that expects the exact markup after a paste fails in one browser and
passes in another.
Test what a reader sees, as the computed alignment, and not the attribute.

## Before you open a pull request

Run the same checks that CI runs:

    pnpm verify

That runs the lint, the type check, the unit tests, and the build.

    pnpm test:e2e

That runs the browser tests. **It needs `pnpm build` to have run first**, which
`pnpm verify` does for you. The browser tests drive the built site in `dist/`,
because the built site is what a visitor gets.

The first run also needs a browser:

    pnpm exec playwright install chromium

The link check is a separate script:

    bash scripts/check-links.sh

Add tests for anything you change.
Put them in the same commit as the code.

## Coding style

- Match the surrounding code. Small, focused functions and clear names beat
  cleverness.
- Keep the converter pure. `src/convert/` takes a string and returns a
  structure. It touches no browser API, which is the only reason a test can
  run it in Node.
- Add dependencies sparingly, and say in the pull request why the standard
  library or an existing dependency does not do the job.
- Never send the text of a chapter anywhere. The promise that it stays on the
  device is the product. A change that breaks it will be refused even if it
  works.

## Commit messages and pull requests

- Write the subject in the present tense. It says what the change does.
- Put no version number in a subject line, and change no version in a commit.
- Describe what changed and why in the pull request, and say how you tested it.

## Reporting security issues

Do not open a public issue for a security problem.
See [SECURITY.md](SECURITY.md) for how to report it privately.

## Code of conduct

By taking part in this project you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
