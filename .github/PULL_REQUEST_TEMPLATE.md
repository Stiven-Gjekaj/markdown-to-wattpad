## Summary

Describe what this pull request changes, and why.

## Related issue

Link the issue that this addresses, if there is one (for example,
"Closes #12").

## Changes

-

## Testing

Explain how you checked the change.
All of these should pass locally:

- [ ] `bash scripts/check-links.sh`
- [ ] `pnpm verify`
- [ ] `pnpm test:e2e`

If the change touches the output, paste the Markdown you tried and say what
the Wattpad writer showed after a paste.

## Checklist

- [ ] Each commit holds one change. A feature is many commits, not one.
- [ ] The code and its tests are in the same commit.
- [ ] The documentation is in its own commit.
- [ ] Every subject line is in the present tense, and carries no version
      number.
- [ ] All text uses Simplified Technical English. No em-dashes, and no emoji.
- [ ] A new test writes the Markdown it needs inside the test, and reads no
      chapter from a file that a writer edits.
- [ ] No code path sends the text of a chapter off the device.
- [ ] Any new dependency carries a permissive licence, and the pull request
      says why it is needed.
