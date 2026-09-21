/**
 * Keeps the draft and the options in this browser.
 *
 * A writer who reloads the page, or closes the tab by mistake, gets the
 * chapter back. Nothing leaves the device: this is local storage, and the
 * site has no server to send it to.
 *
 * Every call is wrapped, because storage can refuse. A private window, a
 * full disk, and a blocked site each make it throw, and a converter that
 * stops working because it cannot remember a draft would be worse than one
 * that forgets it.
 */

const PREFIX = "markdown-to-wattpad:";

export function load(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function save(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // The draft is a convenience. Losing it must not stop the page.
  }
}
