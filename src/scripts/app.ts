import { type Conversion, convert, DEFAULTS, type Options } from "../convert";
import { describe } from "../ui/messages";
import { SAMPLE } from "../ui/sample";
import { copyPlain, copyRich } from "./clipboard";
import { cleanCopy } from "./selection";
import { load, save } from "./storage";

/**
 * Connects the page to the converter.
 *
 * Every keystroke converts the whole chapter again. A long chapter converts
 * in a few milliseconds, so there is no cache to keep in step with the text,
 * and the preview can never show an older version than the one being typed.
 */

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`The page has no element with the id "${id}".`);
  }
  return found as T;
}

const source = element<HTMLTextAreaElement>("source");
const preview = element<HTMLDivElement>("preview");
const title = element<HTMLElement>("part-title");
const stats = element<HTMLElement>("stats");
const status = element<HTMLElement>("status");
const notices = element<HTMLUListElement>("notices");
const copyText = element<HTMLButtonElement>("copy-text");
const copyTitle = element<HTMLButtonElement>("copy-title");
const copyPlainButton = element<HTMLButtonElement>("copy-plain");
const fileInput = element<HTMLInputElement>("open-file");

const toggles = {
  narration: element<HTMLInputElement>("opt-center"),
  joinDialogue: element<HTMLInputElement>("opt-join"),
  boldSpeakers: element<HTMLInputElement>("opt-bold"),
  styleEnding: element<HTMLInputElement>("opt-ending"),
};

let options = readOptions();
let current: Conversion = convert("", options);

function readOptions(): Options {
  try {
    const saved = JSON.parse(load("options") ?? "{}") as Partial<Options>;
    return {
      narration: saved.narration === "left" ? "left" : DEFAULTS.narration,
      joinDialogue: saved.joinDialogue ?? DEFAULTS.joinDialogue,
      boldSpeakers: saved.boldSpeakers ?? DEFAULTS.boldSpeakers,
      styleEnding: saved.styleEnding ?? DEFAULTS.styleEnding,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function showOptions(): void {
  toggles.narration.checked = options.narration === "center";
  toggles.joinDialogue.checked = options.joinDialogue;
  toggles.boldSpeakers.checked = options.boldSpeakers;
  toggles.styleEnding.checked = options.styleEnding;
}

function takeOptions(): void {
  options = {
    narration: toggles.narration.checked ? "center" : "left",
    joinDialogue: toggles.joinDialogue.checked,
    boldSpeakers: toggles.boldSpeakers.checked,
    styleEnding: toggles.styleEnding.checked,
  };
  save("options", JSON.stringify(options));
}

function render(): void {
  current = convert(source.value, options);
  const stray = new Set(
    current.notices.flatMap((notice) =>
      notice.kind === "stray" ? notice.paragraphs : [],
    ),
  );

  // The markup comes from the converter, which escapes every character of
  // the text, and the alignment is one of three fixed words. Nothing that a
  // writer types can reach this string as a tag.
  preview.innerHTML = current.paragraphs
    .map((paragraph, index) => {
      const number = index + 1;
      const flag = stray.has(number) ? ' class="stray"' : "";
      return `<p id="p${number}" style="text-align:${paragraph.align};"${flag}>${paragraph.html}</p>`;
    })
    .join("");
  preview.classList.toggle("empty", current.paragraphs.length === 0);

  title.textContent = current.title;
  title.classList.toggle("missing", current.title === "");
  copyTitle.disabled = current.title === "";

  const empty = current.paragraphs.length === 0;
  copyText.disabled = empty;
  copyPlainButton.disabled = empty;

  stats.textContent = empty
    ? ""
    : `${current.words.toLocaleString("en")} ${current.words === 1 ? "word" : "words"}, ${current.paragraphs.length} ${current.paragraphs.length === 1 ? "paragraph" : "paragraphs"}`;

  notices.replaceChildren(
    ...current.notices.map((notice) => {
      const item = document.createElement("li");
      item.textContent = describe(notice);
      if (notice.kind === "stray") {
        const jump = document.createElement("a");
        jump.href = `#p${notice.paragraphs[0]}`;
        jump.textContent = "Show the first one";
        item.append(" ", jump);
      }
      return item;
    }),
  );
}

let pending = 0;
function schedule(): void {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(() => {
    render();
    save("draft", source.value);
  });
}

let clearStatus = 0;
function say(message: string): void {
  window.clearTimeout(clearStatus);
  status.textContent = message;
  clearStatus = window.setTimeout(() => {
    status.textContent = "";
  }, 4000);
}

async function run(copy: () => Promise<boolean>, done: string) {
  const ok = await copy();
  say(
    ok ? done : "The browser refused to copy. Select the preview and copy it.",
  );
}

copyText.addEventListener("click", () =>
  run(
    () => copyRich(current.html, current.text),
    "Copied. Paste it into the text of your Wattpad part.",
  ),
);
copyTitle.addEventListener("click", () =>
  run(
    () => copyPlain(current.title),
    "Title copied. Paste it into the title box.",
  ),
);
copyPlainButton.addEventListener("click", () =>
  run(() => copyPlain(current.text), "Plain text copied."),
);

source.addEventListener("input", schedule);

for (const toggle of Object.values(toggles)) {
  toggle.addEventListener("change", () => {
    takeOptions();
    render();
  });
}

/**
 * Puts new text in the editor, with the caret and the view at its start.
 *
 * Setting the value leaves the caret at the end, and focusing the box then
 * scrolls the page to wherever the end of a long chapter is.
 */
function replaceText(text: string): void {
  source.value = text;
  source.setSelectionRange(0, 0);
  source.scrollTop = 0;
  source.focus({ preventScroll: true });
  schedule();
}

element<HTMLButtonElement>("load-example").addEventListener("click", () => {
  replaceText(SAMPLE);
});

element<HTMLButtonElement>("clear").addEventListener("click", () => {
  replaceText("");
});

async function open(file: File): Promise<void> {
  replaceText(await file.text());
  say(`Opened ${file.name}.`);
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) {
    void open(file);
  }
  fileInput.value = "";
});

source.addEventListener("dragover", (event) => {
  if (event.dataTransfer?.types.includes("Files")) {
    event.preventDefault();
    source.classList.add("dropping");
  }
});
source.addEventListener("dragleave", () => source.classList.remove("dropping"));
source.addEventListener("drop", (event) => {
  source.classList.remove("dropping");
  const file = event.dataTransfer?.files[0];
  if (file) {
    event.preventDefault();
    void open(file);
  }
});

cleanCopy(preview);

source.value = load("draft") ?? "";
showOptions();
render();

// The page works without this script, as a page that explains the tool. The
// attribute tells the stylesheet and the browser tests that the controls are
// live.
document.documentElement.dataset.ready = "true";
