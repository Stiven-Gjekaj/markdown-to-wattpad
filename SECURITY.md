<div align="center">
  <a href="README.md"><img src="markdown-to-wattpad.svg" alt="Markdown to Wattpad" width="420"></a>
</div>

# Security Policy

## Supported versions

Fixes go to the default branch, and the live site is built from it.
Older versions are not maintained.

## Reporting a vulnerability

Report security problems privately, and not through a public issue.

- Preferred: open a private security advisory with the "Report a vulnerability"
  button on the Security tab of this repository.
- Alternative: email the maintainer at stivenagostingjekaj@gmail.com.

Include the steps to reproduce, the affected commit, and the impact as you
understand it.
You can expect a first answer within a few days.
Your report gets an acknowledgement when the fix ships, unless you prefer to
stay anonymous.

## The threat model

Markdown to Wattpad has an unusual shape, so read this before you report.

**There is no server, and no text is uploaded.**
The converter runs in the visitor's browser.
The site is static files on GitHub Pages.
Therefore a whole class of report does not apply here: there is no upload
endpoint, no database, no account, and no session to take over.

**The page writes HTML from the text a writer pastes.**
The preview shows the converted chapter as markup, and the clipboard receives
the same markup.
The converter escapes every character of the text and writes only `<p>`,
`<b>`, `<i>`, `<u>`, and `<br>`.
A way to make it write anything else is the highest severity problem this
project can have.

**The supply chain is the other real risk.**
The promise of this project is that a chapter never leaves the device.
One malicious dependency breaks that promise in silence, because the code that
reads the chapter already runs in the page.

**These are in scope:**

- Cross-site scripting through the Markdown, the preview, or the clipboard.
- Any code path that sends the text of a chapter off the device.
- A dependency that contacts a network host.
- A crafted text that makes the converter hang or exhaust memory.

**These are out of scope:**

- A missing security header that has no exploit path. Say what the exploit is.
- A report that the site has no login, no rate limit, and no server side
  validation. It has no server, and that is the design.
- A chapter that converts badly. That is a bug, so open a normal issue.
- Findings from an automated scanner with no working demonstration.
