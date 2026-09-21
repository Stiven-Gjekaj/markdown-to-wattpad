/**
 * Finds a line of dialogue.
 *
 * Dialogue in this format is written like a script: a short speaker label, a
 * colon, and the words.
 *
 *     **NES**: There's some left.
 *     **JHN?:** See how easy it is?
 *     MSTR: Name.
 *
 * The label is bold on Wattpad in every published chapter, including the
 * chapters where the Markdown left it plain. So a plain label counts as a
 * speaker when it has the shape of one: capitals, digits, and a few marks,
 * at most four words. Words in lower case never make a label, which keeps a
 * sentence such as "Note: the door" as prose.
 */

export interface Speaker {
  /** The label, without the bold marks and the colon. */
  label: string;
  /** True when the Markdown marks the label bold. */
  bold: boolean;
}

const BOLD_OUTSIDE = /^(\*\*|__)([^*_\s](?:[^*_]{0,38}[^*_\s])?)\1[ \t]*:/;
const BOLD_INSIDE = /^(\*\*|__)([^*_\s](?:[^*_]{0,38}[^*_\s])?)[ \t]*:\1/;
const PLAIN = /^([A-Z0-9?#/&'.-]+(?: [A-Z0-9?#/&'.-]+){0,3}):[ \t]+\S/;
const PLAIN_MAX = 24;

export function speakerOf(line: string): Speaker | null {
  const bold = BOLD_OUTSIDE.exec(line) ?? BOLD_INSIDE.exec(line);
  if (bold) {
    return { label: bold[2], bold: true };
  }

  const plain = PLAIN.exec(line);
  if (
    plain &&
    plain[1].length <= PLAIN_MAX &&
    // A label needs a letter or one of the marks that stand for an unknown
    // speaker, such as "???" or "///". A time such as "10: 30" is not one.
    /[A-Z?/]/.test(plain[1])
  ) {
    return { label: plain[1], bold: false };
  }

  return null;
}

/** Writes a plain label in bold, so that the rest of the line is unchanged. */
export function boldLabel(line: string, speaker: Speaker): string {
  if (speaker.bold) {
    return line;
  }
  return `**${speaker.label}**${line.slice(speaker.label.length)}`;
}
