// The parser of release notes: Markdown in, headings, a preface and a list of entries out. One pass over the lines
// marks code and comments; every later step is a slice of that pass, so the cost is linear in the size of the input.
//
// An entry is a bullet at column 0 (the shape of esbuild's releases), or a `###` heading that has its own text and
// no bullet under it. A `###` heading that has bullets under it is a section heading: its bullets are the entries.
// A bullet that only lists handles ("@alice, @bob") is a credit line, not an entry, and the parser skips it.

export interface Block {
  readonly line: number;
  readonly lang: string;
  readonly code: string;
  readonly before: string;
}

export interface Entry {
  readonly line: number;
  readonly title: string;
  readonly body: string;
  readonly prose: string;
  readonly blocks: readonly Block[];
}

export interface Row {
  readonly no: number;
  readonly text: string;
  readonly code: boolean;
}

export interface Heading {
  readonly line: number;
  readonly level: number;
  readonly text: string;
}

export interface Notes {
  readonly lines: readonly string[];
  readonly rows: readonly Row[];
  readonly headings: readonly Heading[];
  readonly preface: string;
  readonly entries: readonly Entry[];
}

// A complete HTML comment on one line. Matches "<!-- source -->"; rejects "<b>text</b>".
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
// A code fence opener: three or more backticks or tildes, then an info string. Matches "    ```ts" → ("```", "ts"); rejects "text".
const OPENER = /^\s*(`{3,}|~{3,})(.*)$/;
// A code fence closer: only fence characters. Matches "```" and "~~~~"; rejects "```js".
const CLOSER = /^\s*(`{3,}|~{3,})\s*$/;
// The language at the start of an info string. Matches "ts title=x" → ("ts"); rejects nothing: an empty string gives "".
const INFO_LANG = /^\s*([\w+-]*)/;
// A bullet at column 0. Matches "* Fix a bug" and "- Fix a bug"; rejects "    * nested item" and "plain text".
const BULLET = /^[*-]\s+\S/;
// A heading line. Matches "## v1.2.3 (2025-01-01)" → ("##"); rejects "#123 is an issue".
const HEADING = /^(#{1,6})\s+\S/;
// The marker of an entry. Replaced with nothing: "* Fix a bug" → "Fix a bug"; "Fix a bug" is unchanged.
const ENTRY_MARKER = /^(?:[*-]|#{1,6})\s+/;
// A handle, bare or in a link. Matches "[@alice](x)" and "@alice"; rejects "alice@example".
const HANDLE = /\[?@[\w-]+\]?(?:\([^)\n]{0,300}\))?/g;
// The words that join handles in a credit line. Replaced with nothing: "thanks to and" → "  "; "fix" is unchanged.
const JOINERS = /\b(?:and|with|thanks|to|by)\b|[,&:;.\s-]/gi;
// A heading that only names the people of a release. Matches "Contributors" and "New Contributors"; rejects "Features".
const CREDITS_HEADING = /^(?:new )?(?:contributors?|credits?|thanks|acknowledg(?:e)?ments?)\b/i;
// A line break, with or without a carriage return. Splits "a\r\nb" and "a\nb" into two lines.
const LINE_BREAK = /\r?\n/;

const FIRST = 0;
const SECOND = 1;
const NONE = -1;
const CLOSING_LEVEL = 3;
const COMMENT_OPEN = "<!--";
const COMMENT_CLOSE = "-->";
const BACKTICK = "`";

interface Fence {
  readonly char: string;
  readonly size: number;
  readonly info: string;
}

interface Draft {
  readonly row: number;
  readonly line: number;
  readonly lang: string;
  readonly before: string;
  readonly lines: string[];
}

function opens(text: string): Fence | undefined {
  const match = OPENER.exec(text);
  const marker = match?.[SECOND];
  const info = match?.[SECOND + 1] ?? "";
  if (marker === undefined || (marker.startsWith(BACKTICK) && info.includes(BACKTICK))) return undefined;
  return { char: marker.charAt(FIRST), size: marker.length, info };
}

function closes(text: string, fence: Fence): boolean {
  const marker = CLOSER.exec(text)?.[SECOND];
  return marker !== undefined && marker.startsWith(fence.char) && marker.length >= fence.size;
}

// Marks every line as code or prose, strips HTML comments from prose only, and collects the fenced blocks.
// The state lives in this closure: a fence, a comment and the last prose line.
function scanLines(lines: readonly string[]): { readonly rows: readonly Row[]; readonly blocks: readonly { readonly row: number; readonly block: Block }[] } {
  const rows: Row[] = [];
  const blocks: { readonly row: number; readonly block: Block }[] = [];
  const state: { fence: Fence | undefined; draft: Draft | undefined; comment: boolean; last: string } = { fence: undefined, draft: undefined, comment: false, last: "" };

  const finish = (): void => {
    const draft = state.draft;
    if (draft !== undefined) blocks.push({ row: draft.row, block: { line: draft.line, lang: draft.lang, code: draft.lines.join("\n"), before: draft.before } });
    state.draft = undefined;
    state.fence = undefined;
  };

  // Removes the HTML comments of one line. A comment that opens here and closes later sets the state.
  const uncomment = (raw: string): string => {
    const close = state.comment ? raw.indexOf(COMMENT_CLOSE) : NONE;
    const stillOpen = state.comment && close === NONE;
    const rest = state.comment ? raw.slice(close + COMMENT_CLOSE.length) : raw;
    const whole = stillOpen ? "" : rest.replace(HTML_COMMENT, "");
    const open = whole.indexOf(COMMENT_OPEN);
    state.comment = stillOpen || open !== NONE;
    return open === NONE ? whole : whole.slice(FIRST, open);
  };

  const inside = (fence: Fence, raw: string, no: number): void => {
    rows.push({ no, text: raw, code: true });
    if (closes(raw, fence)) finish();
    else state.draft?.lines.push(raw.trim());
  };

  const outside = (raw: string, index: number): void => {
    const no = index + SECOND;
    const text = uncomment(raw);
    const fence = opens(text);
    rows.push({ no, text, code: fence !== undefined });
    state.last = fence === undefined && text.trim() !== "" ? text.trim() : state.last;
    if (fence === undefined) return;
    state.fence = fence;
    state.draft = { row: index, line: no, lang: INFO_LANG.exec(fence.info)?.[SECOND] ?? "", before: state.last, lines: [] };
  };

  lines.forEach((raw, index) => (state.fence === undefined ? outside(raw, index) : inside(state.fence, raw, index + SECOND)));
  finish();
  return { rows, blocks };
}

const isHeading = (row: Row): boolean => !row.code && HEADING.test(row.text);
const levelOf = (row: Row): number => HEADING.exec(row.text)?.[SECOND]?.length ?? FIRST;
const isBullet = (row: Row): boolean => !row.code && BULLET.test(row.text);
const closesRange = (row: Row): boolean => isHeading(row) && levelOf(row) <= CLOSING_LEVEL;

// A title that only lists people. "@alice, @bob" and "Thanks to [@alice](x) and @bob" are credit lines.
function onlyHandles(title: string): boolean {
  return title.includes("@") && title.replace(HANDLE, "").replace(JOINERS, "") === "";
}

interface Range {
  readonly start: number;
  readonly end: number;
  readonly heading: boolean;
}

// For every row, the index of the next row that starts or ends an entry: a bullet or a heading of level 3 or less.
function stops(rows: readonly Row[]): readonly number[] {
  const out = new Array<number>(rows.length);
  rows.reduceRight((next, row, index) => {
    out[index] = next;
    return isBullet(row) || closesRange(row) ? index : next;
  }, rows.length);
  return out;
}

// For every row, the index of the next heading of level 3 or less. A section ends there.
function sectionEnds(rows: readonly Row[]): readonly number[] {
  const out = new Array<number>(rows.length);
  rows.reduceRight((next, row, index) => {
    out[index] = next;
    return closesRange(row) ? index : next;
  }, rows.length);
  return out;
}

// For every row, how many bullets sit before it.
function bulletsBefore(rows: readonly Row[]): readonly number[] {
  const out = new Array<number>(rows.length + SECOND);
  out[FIRST] = FIRST;
  rows.forEach((row, index) => {
    out[index + SECOND] = (out[index] ?? FIRST) + (isBullet(row) ? SECOND : FIRST);
  });
  return out;
}

function rangesOf(rows: readonly Row[]): readonly Range[] {
  const next = stops(rows);
  const ends = sectionEnds(rows);
  const bullets = bulletsBefore(rows);
  // Body text means prose. A heading that holds only a code block is a section title, not an entry.
  const hasText = (from: number, to: number): boolean => rows.slice(from, to).some((row) => !row.code && row.text.trim() !== "");
  return rows.flatMap((row, index): readonly Range[] => {
    const stop = next[index] ?? rows.length;
    if (isBullet(row)) return [{ start: index, end: stop, heading: false }];
    if (!isHeading(row) || levelOf(row) !== CLOSING_LEVEL) return [];
    const end = ends[index] ?? rows.length;
    const hasBullets = (bullets[end] ?? FIRST) - (bullets[index + SECOND] ?? FIRST) > FIRST;
    return hasBullets || !hasText(index + SECOND, end) ? [] : [{ start: index, end, heading: true }];
  });
}

function toEntry(rows: readonly Row[], range: Range, blocks: readonly Block[]): Entry {
  const part = rows.slice(range.start, range.end);
  const first = part[FIRST];
  const prose = part.filter((row) => !row.code).map((row) => row.text);
  return {
    line: first === undefined ? FIRST : first.no,
    title: (first === undefined ? "" : first.text).replace(ENTRY_MARKER, "").trim(),
    body: prose.slice(SECOND).join("\n"),
    prose: prose.join("\n"),
    blocks,
  };
}

const isCredit = (entry: Entry, range: Range): boolean => onlyHandles(entry.title) || (range.heading && CREDITS_HEADING.test(entry.title));

export function parse(source: string): Notes {
  const lines = source.split(LINE_BREAK);
  const scan = scanLines(lines);
  const rows = scan.rows;
  const ranges = rangesOf(rows);
  const blockAt = new Array<number>(rows.length + SECOND).fill(FIRST);
  scan.blocks.forEach(({ row }) => {
    blockAt[row + SECOND] = (blockAt[row + SECOND] ?? FIRST) + SECOND;
  });
  rows.forEach((_, index) => {
    blockAt[index + SECOND] = (blockAt[index] ?? FIRST) + (blockAt[index + SECOND] ?? FIRST);
  });
  const blocks = scan.blocks.map(({ block }) => block);
  const entries = ranges.flatMap((range) => {
    const entry = toEntry(rows, range, blocks.slice(blockAt[range.start] ?? FIRST, blockAt[range.end] ?? blocks.length));
    return isCredit(entry, range) ? [] : [entry];
  });
  const firstStart = ranges[FIRST]?.start ?? rows.length;
  return {
    lines: rows.map((row) => row.text),
    rows,
    headings: rows.filter(isHeading).map((row) => ({ line: row.no, level: levelOf(row), text: row.text })),
    preface: rows
      .slice(FIRST, firstStart)
      .filter((row) => !row.code && !HEADING.test(row.text) && row.text.trim() !== "")
      .map((row) => row.text)
      .join("\n"),
    entries,
  };
}
