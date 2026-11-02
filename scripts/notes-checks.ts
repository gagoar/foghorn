// The checks of release notes. A hard check fails the run. A warning is advice.
import type { Entry, Notes, Row } from "./notes-parse.ts";
import type { Voice } from "./notes-voice.ts";

export const Severity = { Hard: "hard", Warn: "warn" } as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export interface Finding {
  readonly check: string;
  readonly severity: Severity;
  readonly line: number;
  readonly message: string;
}

// What the caller knows about the release. Each field switches on a stricter check: a repository ("owner/name")
// limits the trace to that repository, and a list of handles (from the API, never from free text) limits the credits.
export interface Known {
  readonly repo?: string;
  readonly handles?: readonly string[];
}

export interface Check {
  readonly id: string;
  readonly severity: Severity;
  readonly run: (notes: Notes, voice: Voice, known: Known) => readonly Omit<Finding, "check" | "severity">[];
}

// A breaking-change phrase. Matches "backwards-incompatible changes", "incompatible change" and "Breaking: x"; rejects "breaking news".
const BREAKING = /\b(?:backwards?[- ]incompatible|breaking[- ]changes?|incompatible changes?|breaking release)\b|\bbreaking:/i;
// A negated breaking phrase, inside one clause. Replaced with nothing: "is not one of the breaking change releases" → "";  "not an issue, but a breaking change" is unchanged.
const NEGATED_BREAKING = /\b(?:not|no|non|without)\b[^.,;:!?\n]{0,40}\b(?:breaking|backwards?[- ]incompatible|incompatible)\b/gi;
// A tool that is about breaking changes, not a breaking change. Replaced with nothing: "Fix breaking change detection in x" → "Fix  in x"; "a breaking change" is unchanged.
const BREAKING_TOOL = /\bbreaking[- ]changes?\s+(?:detection|detector|checks?|checker|labels?|policy|workflow|tests?|linter|rules?|warnings?|docs|documentation|script)\b/gi;
// A word that marks a before and after. Matches "Old behavior: esbuild no longer" and "will now"; rejects "known".
const BEHAVIOR = /\b(?:previously|no longer|instead of|used to|now)\b/i;
// An inline code span. Matches "use `--minify`" → "`--minify`"; rejects "use --minify".
const INLINE_CODE = /`[^`\n]+`/;
// An inline code span, in a pattern that finds every one. Replaced with nothing: "use `--minify` now" → "use  now"; "use now" is unchanged.
const CODE_SPANS = /`[^`\n]*`/g;
// A quoted string, straight or curly. Matches 'prints "ok"' → '"ok"'; rejects "prints ok".
const QUOTED = /["“][^"”\n]+["”]/;
// A reference to an issue or pull request. Matches "(#4281)", "[#4281]" and "[a](b) #4281"; rejects "F#3", "color #123456" and "#1 priority".
const TRACE_REF = /[([]\s*#\d+\b|\]\([^)\s]{1,300}\)\s+#\d+\b/;
// A link to a pull request, an issue or a commit on GitHub. Matches "https://github.com/a/b/pull/5"; rejects the same path on another host.
const TRACE_LINK = /https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(?:(?:pull|issues)\/\d+|commit\/[0-9a-f]{7,40})\b/i;
// An advisory id. Matches "GHSA-x2m9-q6w4-mm5r" and "CVE-2025-1234"; rejects "GHSA-zzzz".
const TRACE_ID = /\bGHSA(?:-[a-z0-9]{4}){3}\b|\bCVE-\d{4}-\d{4,}\b/i;
// A Markdown link. Matches "[#4281](x)" → the whole link; rejects "[a] (b)".
const MARKDOWN_LINK = /\[[^\]\n]{0,200}\]\([^)\s]{0,500}\)/g;
// A credit by handle. Matches "Thanks to @evanw" and "contributed by [@x]"; rejects "Thanks to everyone".
const CREDIT = /\b(?:thanks to|contributed by|submitted by|reported by|fixed by|authored by)\s+\[?@[\w-]+/i;
// A negated credit, inside one clause. Replaced with nothing: "Not fixed by @bob" → ""; "Fixed by @bob" is unchanged.
const NEGATED_CREDIT = /(?:\b(?:not|never|no|without)\b|\b\w+n['’]t\b)[^.,;:!?\n]{0,30}\b(?:thanks to|contributed by|submitted by|reported by|fixed by|authored by)\s+\[?@[\w-]+/gi;
// A credit sentence: the credit words and the rest of the sentence. Matches "Thanks to @a and @b" → the whole phrase; rejects "Thanks to" without a following phrase only in the handle scan: the pattern itself matches "Thanks to everyone".
const CREDIT_SENTENCE = /\b(?:thanks to|contributed by|submitted by|reported by|fixed by|authored by)\b(?:[^.\n]|\.(?!\s|$)){0,400}/gi;
// A handle on its own. Matches "@alice" → ("alice"); rejects "@babel/core" and "a@b.example".
const HANDLE = /(?<![\w@/])@([\w-]+)(?![\w/@-])/g;
// An emoji. Matches "🎉" and "✔️"; rejects "©", "™" and "✔" without a variation selector.
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|[\u{1F300}-\u{1FAFF}]/u;
// An Affects line at the start of a line, bold or not. Matches "Affects: Node 12 users" and "**Affects:** x"; rejects "This affects x".
const AFFECTS = /^\s*(?:\*\*)?Affects:/m;
// A change that can break someone. Matches "now requires" and "no longer"; rejects "now supports".
const RISK = /\b(?:breaking|backwards?[- ]incompatible|incompatible changes?|no longer|now requires?|raises the .{0,30}requirements?)\b/i;
// A filler opener. Matches "We're excited to announce" and "Welcome to"; rejects "This release fixes".
const PADDING = /\bwe(?:['’]re| are) (?:so |very )?(?:excited|thrilled|happy|pleased|delighted|proud)|\b(?:pleased|excited|thrilled|delighted) to (?:announce|share|introduce)|\bwelcome to\b|\bthis release brings\b|\bpacked with\b/gi;
// A version. Matches "v0.27.0" and "1.2.3"; rejects "1.2".
const VERSION = /\bv?\d+\.\d+\.\d+\b/;
// A date. Matches "2025-11-09" and "2026.08.27"; rejects "2025-11".
const DATE = /\b\d{4}[-./]\d{2}[-./]\d{2}\b/;
// A character with a meaning in a regex. Replaced with a backslash and itself: "a.b" → "a\\.b"; "ab" is unchanged.
const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;
// A break between paragraphs. Splits "a\n\nb" into two paragraphs; leaves "a\nb" in one.
const PARAGRAPH_BREAK = /\n\s*\n/;
// A code block that starts with a comment. Matches "// Original code" and "# Old output"; rejects "const x = 1".
const COMMENT_LABEL = /^(?:\/\/|#|\/\*|--)\s*\S/;
// A repository name. Matches "evanw/esbuild"; rejects "evanw" and "a/b/c".
export const REPO_NAME = /^[\w.-]+\/[\w.-]+$/;

const NONE = 0;
const TITLE_CHARS = 60;
const FIRST_LINE = 1;
// Limits taken from 138 entries of the 30 latest esbuild releases: the most examples in one entry was 4,
// and the longest paragraph was 859 characters. A warning fires above both.
const MAX_EXAMPLES = 4;
const MAX_PARAGRAPH_CHARS = 900;
const CREDIT_CHECK = "credit-unverified";
const first = <T>(items: readonly T[]): T | undefined => items[NONE];

type Found = Omit<Finding, "check" | "severity">;

const entryLine = (entry: Entry, message: string): Found => ({ line: entry.line, message });
const where = (entry: Entry): string => `"${entry.title.slice(NONE, TITLE_CHARS)}"`;
const escapeRegex = (word: string): string => word.replace(REGEX_SPECIAL, "\\$&");

// Prose rows: the lines outside code blocks, with the inline code spans taken out.
const proseRows = (notes: Notes): readonly Row[] =>
  notes.rows.filter((row) => !row.code).map((row) => ({ ...row, text: row.text.replace(CODE_SPANS, "") }));

const withoutNegation = (text: string): string => text.replace(BREAKING_TOOL, "").replace(NEGATED_BREAKING, "");
const hasBreaking = (text: string): boolean => BREAKING.test(withoutNegation(text));

function breakingNoPreface(notes: Notes): readonly Found[] {
  const offender = first(notes.entries.filter((e) => hasBreaking(e.prose)));
  if (offender === undefined || hasBreaking(notes.preface)) return [];
  return [entryLine(offender, `${where(offender)} says the release is breaking, but no preface line opens the notes. Open with the preface and the pinning advice.`)];
}

const paragraphsOf = (text: string): readonly string[] => text.split(PARAGRAPH_BREAK);
const hasExample = (paragraph: string): boolean => INLINE_CODE.test(paragraph) || QUOTED.test(paragraph);

// A fenced block shows old and new output. So does a code span or a quoted string in the same paragraph as the
// sentence that holds a behavior word. A code span in another paragraph shows nothing about that sentence.
const showsOldAndNew = (entry: Entry): boolean =>
  entry.blocks.length > NONE || paragraphsOf(entry.prose).some((paragraph) => BEHAVIOR.test(paragraph) && hasExample(paragraph));

// An entry with no code span and no quoted string anywhere has nothing that could be shown: the check skips it.
const hasAnythingToShow = (entry: Entry): boolean => hasExample(entry.prose);

function behaviorNoExample(notes: Notes): readonly Found[] {
  return notes.entries
    .filter((e) => BEHAVIOR.test(e.prose) && hasAnythingToShow(e) && !showsOldAndNew(e))
    .map((e) => entryLine(e, `${where(e)} describes a behavior change but shows no old or new output. Add a fenced block, or quote the old and the new behavior inline in the paragraph that says "previously" or "now".`));
}

const dropForeignLinks = (text: string, link: RegExp): string => text.replace(MARKDOWN_LINK, (found) => (link.test(found) ? found : ""));

// The pattern of a link to a pull request, an issue or a commit of one repository.
const linkOf = (repo: string): RegExp =>
  new RegExp(`https?:\\/\\/github\\.com\\/${escapeRegex(repo)}\\/(?:(?:pull|issues)\\/\\d+|commit\\/[0-9a-f]{7,40})\\b`, "i");

// With a repository, only a link to that repository counts, and a link to another one hides its own "#n".
function hasTrace(text: string, repo: string | undefined): boolean {
  const link = repo === undefined ? TRACE_LINK : linkOf(repo);
  const seen = repo === undefined ? text : dropForeignLinks(text, link);
  return TRACE_REF.test(seen) || link.test(seen) || TRACE_ID.test(seen);
}

const hasCredit = (text: string): boolean => CREDIT.test(text.replace(NEGATED_CREDIT, ""));

function entryNoLinkOrCredit(notes: Notes, _voice: Voice, known: Known): readonly Found[] {
  return notes.entries
    .filter((e) => !hasTrace(e.prose, known.repo) && !hasCredit(e.prose))
    .map((e) => entryLine(e, `${where(e)} has no issue, pull request or advisory link and no credit by handle.`));
}

// The handles that a text credits: every handle in a sentence that holds a credit phrase. A negated credit counts for none.
function creditedIn(text: string): readonly string[] {
  const sentences = text.replace(NEGATED_CREDIT, "").match(CREDIT_SENTENCE) ?? [];
  return sentences.flatMap((sentence) => [...sentence.matchAll(HANDLE)].map((m) => (m[1] ?? "").toLowerCase()));
}

// A leading at sign. Replaced with nothing: "@alice" → "alice"; "alice" is unchanged.
export const AT_SIGN = /^@/;
const bare = (handle: string): string => handle.replace(AT_SIGN, "").toLowerCase();

function creditUnverified(notes: Notes, _voice: Voice, known: Known): readonly Found[] {
  if (known.handles === undefined) return [];
  const allowed = new Set(known.handles.map(bare));
  const unknown = (text: string): readonly string[] => [...new Set(creditedIn(text).filter((handle) => !allowed.has(handle)))];
  const preface = unknown(notes.preface).map((handle) => ({ line: FIRST_LINE, message: `The preface credits @${handle}, who is not in the authors or reporters that the API returned.` }));
  const entries = notes.entries.flatMap((e) =>
    unknown(e.prose).map((handle) => entryLine(e, `${where(e)} credits @${handle}, who is not in the authors or reporters that the API returned. Credit only people the API names.`)),
  );
  return [...preface, ...entries];
}

const labels = (voice: Voice): readonly string[] => Object.values(voice.exampleStyle.labels).map((l) => l.toLowerCase());

function unlabeledCodeBlock(notes: Notes, voice: Voice): readonly Found[] {
  const known = labels(voice);
  const named = (text: string): boolean => known.some((label) => text.toLowerCase().includes(label));
  const introduced = (before: string): boolean => before.endsWith(":") || named(before);
  return notes.entries.flatMap((entry) =>
    entry.blocks
      .filter((b) => !introduced(b.before) && !named(b.code) && !COMMENT_LABEL.test(b.code))
      .map((b) => ({ line: b.line, message: `A code block in ${where(entry)} has no label. Introduce it with a line that ends in a colon, or start it with a comment such as "// ${voice.exampleStyle.labels.original}".` })),
  );
}

function marketingWord(notes: Notes, voice: Voice): readonly Found[] {
  if (!voice.bannedWords.length) return [];
  // The banned words joined into one pattern. Matches "a seamless fit" when "seamless" is listed; rejects "a close fit" and the file name "seamless.txt".
  const banned = new RegExp(`(?<![\\w./-])(?:${voice.bannedWords.map(escapeRegex).join("|")})(?![\\w-]|\\.\\w|/)`, "gi");
  return proseRows(notes).flatMap((row) =>
    [...row.text.matchAll(banned)].map((hit) => ({ line: row.no, message: `"${hit[NONE]}" is a marketing word. Say what the change does, with a number or an example.` })),
  );
}

// The size of an entry: its prose plus its code blocks. A page of examples weighs as much as a page of text.
const sizeOf = (entry: Entry): number => entry.prose.length + entry.blocks.reduce((sum, block) => sum + block.code.length, NONE);

function entryTooLong(notes: Notes, voice: Voice): readonly Found[] {
  return notes.entries
    .filter((e) => sizeOf(e) > voice.maxEntryChars)
    .map((e) => entryLine(e, `${where(e)} has ${sizeOf(e)} characters of prose and code. The voice allows ${voice.maxEntryChars}. Split it, cut the background, or show fewer examples.`));
}

function tooManyExamples(notes: Notes): readonly Found[] {
  return notes.entries
    .filter((e) => e.blocks.length > MAX_EXAMPLES)
    .map((e) => entryLine(e, `${where(e)} has ${e.blocks.length} code blocks. Show the ${MAX_EXAMPLES} that best show the change and name the rest in one sentence.`));
}

const longest = (entry: Entry): number => paragraphsOf(entry.body).reduce((most, paragraph) => Math.max(most, paragraph.trim().length), NONE);

function wallOfText(notes: Notes): readonly Found[] {
  return notes.entries
    .filter((e) => longest(e) > MAX_PARAGRAPH_CHARS)
    .map((e) => entryLine(e, `${where(e)} has a paragraph of ${longest(e)} characters. Split it where the idea changes: background, old behavior, new behavior.`));
}

// A version or a date in any heading counts, and so does one in the preface.
function missingVersionOrDate(notes: Notes): readonly Found[] {
  const head = `${notes.headings.map((h) => h.text).join("\n")}\n${notes.preface}`;
  const missing = [VERSION.test(head) ? "" : "version", DATE.test(head) ? "" : "date"].filter((m) => m !== "");
  const line = notes.headings[NONE]?.line ?? FIRST_LINE;
  return missing.length ? [{ line, message: `The header has no ${missing.join(" and no ")}.` }] : [];
}

function affectsLineMissing(notes: Notes, voice: Voice): readonly Found[] {
  if (!voice.affectsLine) return [];
  return notes.entries
    .filter((e) => RISK.test(withoutNegation(e.prose)) && !AFFECTS.test(e.prose))
    .map((e) => entryLine(e, `${where(e)} can break someone but has no "Affects:" line. Say who is affected, and add a "To check:" command when one exists.`));
}

function padding(notes: Notes): readonly Found[] {
  return proseRows(notes).flatMap((row) =>
    [...row.text.matchAll(PADDING)].map((hit) => ({ line: row.no, message: `"${hit[NONE]}" is filler. Start with what changed.` })),
  );
}

function emoji(notes: Notes): readonly Found[] {
  return proseRows(notes)
    .filter((row) => EMOJI.test(row.text))
    .map((row) => ({ line: row.no, message: "An emoji. The esbuild voice uses none." }));
}

export const CHECKS: readonly Check[] = [
  { id: "breaking-no-preface", severity: Severity.Hard, run: breakingNoPreface },
  { id: "behavior-no-example", severity: Severity.Hard, run: behaviorNoExample },
  { id: "entry-no-link-or-credit", severity: Severity.Hard, run: entryNoLinkOrCredit },
  { id: CREDIT_CHECK, severity: Severity.Hard, run: creditUnverified },
  { id: "unlabeled-code-block", severity: Severity.Warn, run: unlabeledCodeBlock },
  { id: "marketing-word", severity: Severity.Warn, run: marketingWord },
  { id: "entry-too-long", severity: Severity.Warn, run: entryTooLong },
  { id: "too-many-examples", severity: Severity.Warn, run: tooManyExamples },
  { id: "wall-of-text", severity: Severity.Warn, run: wallOfText },
  { id: "missing-version-or-date", severity: Severity.Warn, run: missingVersionOrDate },
  { id: "affects-line-missing", severity: Severity.Warn, run: affectsLineMissing },
  { id: "padding", severity: Severity.Warn, run: padding },
  { id: "emoji", severity: Severity.Warn, run: emoji },
];

export const CHECK_IDS: readonly string[] = CHECKS.map((c) => c.id);

export function runChecks(notes: Notes, voice: Voice, disabled: readonly string[] = [], known: Known = {}): readonly Finding[] {
  return CHECKS.filter((c) => !disabled.includes(c.id)).flatMap((c) =>
    c.run(notes, voice, known).map((f) => ({ check: c.id, severity: voice.severity?.[c.id] ?? c.severity, ...f })),
  );
}
