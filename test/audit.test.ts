import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "../scripts/notes-parse.ts";
import { cli, read, ROOT } from "./helpers.ts";

const HEAD = "## v1.2.3 (2025-01-01)\n\n";
const LINK = "([#1](https://github.com/a/b/issues/1))";
const TRACE = "entry-no-link-or-credit";
const BEHAVIOR = "behavior-no-example";
const BREAKING = "breaking-no-preface";
const EXIT = { ok: 0, failed: 1, usage: 2 } as const;
const HOLDOUT_COUNT = 10;
const MAX_EXCERPT_CHARS = 1500;
const BIG = 200_000;
const FENCE_GROUPS = BIG / 4;
const TITLE_CHARS = 5;
const TWO = 2;
const THREE = 3;
const NINE = 9;
const HANDLES = "--handles";
const CREDIT_UNVERIFIED = "credit-unverified";
const VERSION_CHECK = "missing-version-or-date";
const STDIN_ENTRY = "* a (#1)\n";
const AT = { robustOne: 5, robustTwo: 7, welcome: NINE, heading: THREE } as const;
const MAX_SECONDS = 3;
const MS = 1000;
const MIN_LABEL = 2;
const BYTES_OVER_LIMIT = 70_000;
// The source comment that opens a hold-out fixture. Matches "<!-- source: https://github.com/vitejs/vite/releases/tag/v8.3.5 (excerpt) -->"; rejects "<!-- note -->".
const HOLDOUT_SOURCE = /^<!-- source: https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/tag\/\S+ \(excerpt\) -->\n/;

interface Hit {
  readonly check: string;
  readonly severity: string;
  readonly line: number;
  readonly message: string;
}

function run(text: string, args: readonly string[] = []): { readonly code: number; readonly hits: readonly Hit[]; readonly err: string } {
  const result = cli(["--json", ...args], text);
  const report: { files: { findings: Hit[] }[] } | undefined = result.out === "" ? undefined : JSON.parse(result.out);
  return { code: result.code, hits: report?.files[0]?.findings ?? [], err: result.err };
}

const hard = (text: string, args: readonly string[] = []): readonly string[] => run(text, args).hits.filter((h) => h.severity === "hard").map((h) => h.check);
const ids = (text: string, args: readonly string[] = []): readonly string[] => run(text, args).hits.map((h) => h.check);

// ---- 1. the layouts of vite, ruff and deno ----

test("1: a section heading with bullets under it is not an entry, and its bullets are", () => {
  const text = `${HEAD}### Features\n\n* Add a thing ${LINK}\n* Add another ${LINK}\n\n### Bug Fixes\n\n* Fix a thing ${LINK}\n`;
  assert.deepEqual(hard(text), []);
  assert.deepEqual(parse(text).entries.map((e) => e.title.slice(0, TITLE_CHARS)), ["Add a", "Add a", "Fix a"]);
});

test("1: a Contributors heading and a bare handle bullet are not entries", () => {
  const text = `${HEAD}* Fix a thing ${LINK}\n\n### Contributors\n\n* @alice\n* @alice, @bob\n* [@carol](https://github.com/carol) and @dave\n`;
  assert.deepEqual(hard(text), []);
  assert.equal(parse(text).entries.length, 1);
  assert.deepEqual(hard(`${HEAD}* Fix a thing ${LINK}\n\n### Contributors\n\nThanks to @alice and @bob.\n`), []);
});

test("1: a heading with a version and a date in it, as deno writes it, counts for the header", () => {
  const text = "### 2.9.6 / 2026.08.27\n\n- fix(core): cap buffers (#36432)\n- fix(cache): combine headers (#36476)\n";
  assert.deepEqual(hard(text), []);
  assert.ok(!ids(text).includes(VERSION_CHECK));
});

test("1: a date in the preface counts, as in ruff, and a heading that holds only code is not an entry", () => {
  const text = "## Release Notes\n\nReleased on 2026-10-22.\n\n### Bug fixes\n\n- Avoid a crash ([#28362](https://github.com/a/b/pull/28362))\n\n### Install\n\n```sh\ncurl x | sh\n```\n";
  assert.deepEqual(hard(text), []);
  assert.deepEqual(run(text).hits.filter((h) => h.check === VERSION_CHECK).map((h) => h.message), ["The header has no version."]);
});

test("1: a ### heading with its own text and no bullet is still an entry", () => {
  const text = `${HEAD}### Fix a crash\n\nThe tool crashed on empty input.\n`;
  assert.deepEqual(hard(text), [TRACE]);
  assert.equal(parse(text).entries[0]?.title, "Fix a crash");
});

// ---- 2 and 3: the wrapper and the claims about read-only live in gh-read.test.ts and repo.test.ts ----

// ---- 4. untrusted input: --repo and --handles ----

const ENTRY = (extra: string): string => `${HEAD}* Fix a thing ${extra}\n`;

test("4: --repo accepts only links to that repository", () => {
  const args = ["--repo", "a/b"];
  assert.deepEqual(hard(ENTRY("([#1](https://github.com/a/b/issues/1))"), args), []);
  assert.deepEqual(hard(ENTRY("(#1)"), args), []);
  assert.deepEqual(hard(ENTRY("[#1]"), args), []);
  assert.deepEqual(hard(ENTRY("([abc1234](https://github.com/a/b/commit/abc1234def))"), args), []);
  assert.deepEqual(hard(ENTRY("GHSA-x2m9-q6w4-mm5r"), args), []);
  assert.deepEqual(hard(ENTRY("CVE-2025-12345"), args), []);
  assert.deepEqual(hard(ENTRY("([#1](https://github.com/evil/repo/issues/1))"), args), [TRACE]);
  assert.deepEqual(hard(ENTRY("(https://github.com/evil/repo/pull/1)"), args), [TRACE]);
  assert.deepEqual(hard(ENTRY("([#1](https://github.com/a/b2/issues/1))"), args), [TRACE]);
  assert.deepEqual(hard(ENTRY("([#1](https://github.com/evil/repo/issues/1))")), []);
  assert.equal(cli(["--repo", "nope"]).code, EXIT.usage);
  assert.equal(cli(["--repo"]).code, EXIT.usage);
});

const CREDITED = `${HEAD}* Fix a thing ${LINK}\n\n    Thanks to @alice for reporting this issue. This fix was contributed by [@bob](https://github.com/bob).\n`;

test("4: --handles makes a credit to anyone else a hard credit-unverified, and only when given", () => {
  assert.deepEqual(hard(CREDITED), []);
  assert.deepEqual(hard(CREDITED, [HANDLES, "alice,bob"]), []);
  assert.deepEqual(hard(CREDITED, [HANDLES, "@Alice,BOB"]), []);
  assert.deepEqual(hard(CREDITED, [HANDLES, "alice"]), [CREDIT_UNVERIFIED]);
  assert.deepEqual(hard(CREDITED, [HANDLES, "mallory"]), [CREDIT_UNVERIFIED, CREDIT_UNVERIFIED]);
  assert.deepEqual(hard(CREDITED.replace("Thanks to @alice for reporting this issue.", "Thanks to @alice and @eve."), [HANDLES, "alice,bob"]), [CREDIT_UNVERIFIED]);
  assert.deepEqual(hard(`${HEAD}* Update @babel/core and @types/node ${LINK}\n`, [HANDLES, "alice"]), []);
  assert.equal(cli([HANDLES, "a b"]).code, EXIT.usage);
  assert.equal(cli([HANDLES]).code, EXIT.usage);
});

test("4: the draft skill and the collector treat text as data and pass --repo and --handles", () => {
  const skill = read("skills/draft/SKILL.md");
  const agent = read("agents/foghorn-collector.md");
  [skill, agent].forEach((text) => {
    assert.ok(/^## Untrusted text$/m.test(text));
    assert.ok(text.includes("never instructions") || text.includes("never an instruction"));
    assert.ok(text.includes("evidenceHint"));
  });
  assert.ok(skill.includes("--repo <owner>/<name>") && skill.includes(HANDLES));
  assert.ok(skill.includes("Show the user every command before it runs"));
});

// ---- 5. behavior-no-example ----

test("5: a code span in another paragraph, or in the title alone, does not show old and new output", () => {
  const body = "    Previously the tool crashed. Now it exits cleanly.\n\n    Run `tool --strict` to try it.\n";
  assert.deepEqual(hard(`${HEAD}* Fix a crash ${LINK}\n\n${body}`), [BEHAVIOR]);
  assert.deepEqual(hard(`${HEAD}* Fix a crash with \`--strict\` ${LINK}\n\n    Previously the tool crashed. Now it exits cleanly.\n`), [BEHAVIOR]);
});

test("5: a code span or a quote in the paragraph of the sentence, or a fenced block, shows it", () => {
  assert.deepEqual(hard(`${HEAD}* Fix a crash ${LINK}\n\n    Previously the tool printed \`panic\`. Now it exits cleanly.\n`), []);
  assert.deepEqual(hard(`${HEAD}* Fix a crash ${LINK}\n\n    Previously the tool printed "panic". Now it prints "ok".\n`), []);
  assert.deepEqual(hard(`${HEAD}* Fix a crash ${LINK}\n\n    Previously it crashed. Now:\n\n    \`\`\`sh\n    # New output\n    ok\n    \`\`\`\n`), []);
});

// ---- 6. trace and credit are tight ----

test("6: F#3, a color, a priority and another host do not count as a trace", () => {
  ["Fix F#3 in the parser", "Fix color #123456 in the parser", "Fix the #1 priority", "Fix a thing (see https://example.com/a/b/pull/5)", "Fix a thing /pull/5"].forEach((title) => {
    assert.deepEqual(hard(`${HEAD}* ${title}\n`), [TRACE], title);
  });
});

test("6: a negated credit is no credit, and a real one still is", () => {
  assert.deepEqual(hard(`${HEAD}* Fix F#3 in the parser\n\n    Not fixed by @bob.\n`), [TRACE]);
  assert.deepEqual(hard(`${HEAD}* Fix a thing\n\n    This was never reported by @bob.\n`), [TRACE]);
  assert.deepEqual(hard(`${HEAD}* Fix a thing\n\n    This wasn't fixed by @bob.\n`), [TRACE]);
  assert.deepEqual(hard(`${HEAD}* Fix a thing\n\n    Fixed by @bob.\n`), []);
  assert.deepEqual(hard(`${HEAD}* Fix a thing (#12)\n`), []);
  assert.deepEqual(hard(`${HEAD}* Fix a thing ([#12](https://example.invalid/x/12))\n`), []);
});

// ---- 7. breaking detection ----

const WITH_BODY = (line: string): string => `${HEAD}* Change a thing ${LINK}\n\n    ${line}\n`;

test("7: a breaking phrase in a clause that has no negation is breaking", () => {
  [
    "This is not an issue, but it is a breaking change.",
    "Breaking: the option is gone.",
    "This is an incompatible change.",
    "These are incompatible changes for plugins.",
  ].forEach((line) => assert.ok(hard(WITH_BODY(line)).includes(BREAKING), line));
});

test("7: a negated phrase, and breaking change detection as a tool, are not breaking", () => {
  [
    "This is not a breaking change.",
    "Fix breaking change detection in the checker.",
    "This is not an incompatible change.",
  ].forEach((line) => assert.ok(!hard(WITH_BODY(line)).includes(BREAKING), line));
  assert.deepEqual(hard(`${HEAD}* Fix breaking change detection in the checker ${LINK}\n`), []);
});

// ---- 8. fences ----

test("8: a shorter or different fence line inside a block does not close it", () => {
  const nested = `${HEAD}* Change a thing ${LINK}\n\n    Previously \`a\`; now \`b\`.\n\n\`\`\`\`md\n\`\`\`js\n* inside no link\n\`\`\`\n\`\`\`\`\n`;
  assert.equal(parse(nested).entries.length, 1);
  assert.equal(parse(nested).entries[0]?.blocks.length, 1);
  const tilde = `${HEAD}* T ${LINK}\n\n~~~md\n\`\`\`\n* inside\n\`\`\`\n~~~\n`;
  assert.equal(parse(tilde).entries.length, 1);
  assert.equal(parse(tilde).entries[0]?.blocks.length, 1);
  const info = `${HEAD}* T ${LINK}\n\n\`\`\`md\n\`\`\`js\n* inside\n\`\`\`\n\n* Real entry ${LINK}\n`;
  assert.equal(parse(info).entries.length, TWO);
});

test("8: three backticks on one line with text after them are not a fence", () => {
  const text = `${HEAD}* T ${LINK}\n\n\`\`\`not a fence\`\`\`\n\n* Second ${LINK}\n`;
  const notes = parse(text);
  assert.equal(notes.entries.length, TWO);
  assert.equal(notes.entries[0]?.blocks.length, 0);
});

test("8: a fence inside a list item still closes, and an unterminated block runs to the end", () => {
  const item = `${HEAD}* T ${LINK}\n\n    \`\`\`js\n    a\n    \`\`\`\n\n* Second ${LINK}\n`;
  assert.equal(parse(item).entries.length, TWO);
  assert.equal(parse(item).entries[0]?.blocks[0]?.code, "a");
});

test("8: a comment marker inside code does not eat an entry, and a comment outside code is removed", () => {
  const text = `${HEAD}* T ${LINK}\n\n\`\`\`html\n<!-- c\n\`\`\`\n\n* Second entry has no link\n\n<!-- hidden\n* hidden entry no link\n-->\n`;
  const notes = parse(text);
  assert.deepEqual(notes.entries.map((e) => e.title), [`T ${LINK}`, "Second entry has no link"]);
  assert.deepEqual(hard(text), [TRACE]);
});

// ---- 9. the hold-out ----

test("9: the hold-out is ten short quoted excerpts of other projects, and the default voice fails none of them hard", () => {
  const names = readdirSync(`${ROOT}/testdata/holdout`).filter((name) => name.endsWith(".md"));
  assert.equal(names.length, HOLDOUT_COUNT);
  names.forEach((name) => {
    const path = `testdata/holdout/${name}`;
    const text = read(path);
    assert.ok(HOLDOUT_SOURCE.test(text), `${path} must start with the source comment`);
    assert.ok(text.length < MAX_EXCERPT_CHARS, `${path} is not an excerpt`);
    const result = cli(["--json", `${ROOT}/${path}`]);
    assert.equal(result.code, EXIT.ok, `${path}\n${result.out}`);
  });
});

test("9: an entry of a hold-out release that links nothing is still a hard failure", () => {
  assert.deepEqual(hard("### 2.9.6 / 2026.08.27\n\n- fix(cli_parser): remove orphaned sync-types parser\n"), [TRACE]);
});

// ---- 10. performance ----

function seconds(text: string): number {
  const start = performance.now();
  const result = cli([], text);
  assert.ok(result.code === EXIT.ok || result.code === EXIT.failed);
  return (performance.now() - start) / MS;
}

test("10: the parser and the checks are linear: 200k lines, in each shape, run in under 3 seconds", () => {
  const bullets = Array.from({ length: BIG }, (_, i) => `* Fix thing ${i} ${LINK}`).join("\n");
  const paragraphs = Array.from({ length: BIG }, (_, i) => `Paragraph ${i}`).join("\n\n");
  const oneEntry = `* One ${LINK}\n${Array.from({ length: BIG }, (_, i) => `    line ${i}`).join("\n")}`;
  const fences = Array.from({ length: FENCE_GROUPS }, () => "```js\ncode\n```\ntext").join("\n");
  [bullets, paragraphs, oneEntry, fences].forEach((text) => assert.ok(seconds(text) < MAX_SECONDS));
});

// ---- 11 and 12. emoji and line numbers ----

test("11: the symbols (c), (tm), a check mark and a warning sign are not emoji, a real emoji is, and code is skipped", () => {
  const plain = `${HEAD}* Fix © and ™ and ✔ and ⚠ and ▶ ${LINK}\n`;
  assert.ok(!ids(plain).includes("emoji"));
  assert.ok(ids(`${HEAD}* Fix a thing 🎉 ${LINK}\n`).includes("emoji"));
  assert.ok(ids(`${HEAD}* Fix a thing ✔️ ${LINK}\n`).includes("emoji"));
  assert.ok(!ids(`${HEAD}* Fix a thing ${LINK}\n\n\`\`\`txt\n🎉\n\`\`\`\n`).includes("emoji"));
});

test("12: marketing, padding and emoji report the line of each hit, and ignore code spans and file names", () => {
  const text = `${HEAD}* Fix a thing ${LINK}\n\n    This is robust.\n\n    A seamless fit and a robust one.\n\n    Welcome to the release 🎉.\n`;
  const hits = run(text).hits;
  assert.deepEqual(hits.filter((h) => h.check === "marketing-word").map((h) => h.line), [AT.robustOne, AT.robustTwo, AT.robustTwo]);
  assert.deepEqual(hits.filter((h) => h.check === "padding").map((h) => h.line), [AT.welcome]);
  assert.deepEqual(hits.filter((h) => h.check === "emoji").map((h) => h.line), [AT.welcome]);
  const quiet = `${HEAD}* Fix robust.txt ${LINK}\n\n    Use \`robust\` and \`welcome to\` in \`code\`. Open robust.txt.\n`;
  assert.ok(!ids(quiet).includes("marketing-word") && !ids(quiet).includes("padding"));
});

test("12: the missing version is reported at the line of the first heading", () => {
  const hit = run("Intro\n\n## Notes\n\n* Fix a thing (#1)\n").hits.find((h) => h.check === VERSION_CHECK);
  assert.equal(hit?.line, AT.heading);
});

// ---- 13. the voice file ----

function voiceFile(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "foghorn-voice-"));
  writeFileSync(join(dir, name), content);
  return join(dir, name);
}

const validVoice = (): Record<string, unknown> => JSON.parse(read("foghorn.voice.example.json"));

test("13: a voice file that is not JSON never echoes its bytes", () => {
  const path = voiceFile("v.json", "root:x:0:0:SECRETBYTES");
  const result = cli(["--voice", path], STDIN_ENTRY);
  assert.equal(result.code, EXIT.usage);
  assert.ok(result.err.includes("not valid JSON"));
  assert.ok(!result.err.includes("SECRETBYTES") && !result.err.includes("root:x"));
});

test("13: a voice must be a regular file of at most 64 KiB", () => {
  assert.equal(cli(["--voice", "/dev/zero"], STDIN_ENTRY).code, EXIT.usage);
  assert.equal(cli(["--voice", tmpdir()], STDIN_ENTRY).code, EXIT.usage);
  const big = voiceFile("big.json", JSON.stringify({ ...validVoice(), pad: "x".repeat(BYTES_OVER_LIMIT) }));
  assert.equal(cli(["--voice", big], STDIN_ENTRY).code, EXIT.usage);
  const dir = mkdtempSync(join(tmpdir(), "foghorn-link-"));
  mkdirSync(join(dir, "d"));
  symlinkSync("/dev/zero", join(dir, "z.json"));
  assert.equal(cli(["--voice", join(dir, "z.json")], STDIN_ENTRY).code, EXIT.usage);
});

test("13: example labels shorter than 3 characters are rejected, and so are unknown nested keys", () => {
  const base = validVoice() as { exampleStyle: { labels: Record<string, string> }; prefaceRules: Record<string, string> };
  const short = { ...base, exampleStyle: { labels: { ...base.exampleStyle.labels, original: "x".repeat(MIN_LABEL) } } };
  assert.equal(cli(["--voice", voiceFile("s.json", JSON.stringify(short))], STDIN_ENTRY).code, EXIT.usage);
  const evil = { ...base, prefaceRules: { ...base.prefaceRules, evil: "x" } };
  assert.equal(cli(["--voice", voiceFile("e.json", JSON.stringify(evil))], STDIN_ENTRY).code, EXIT.usage);
  const labels = { ...base, exampleStyle: { labels: { ...base.exampleStyle.labels, extra: "extra" } } };
  assert.equal(cli(["--voice", voiceFile("l.json", JSON.stringify(labels))], STDIN_ENTRY).code, EXIT.usage);
  const style = { ...base, exampleStyle: { ...base.exampleStyle, extra: 1 } };
  assert.equal(cli(["--voice", voiceFile("x.json", JSON.stringify(style))], STDIN_ENTRY).code, EXIT.usage);
  assert.equal(cli(["--voice", voiceFile("ok.json", JSON.stringify(base))], STDIN_ENTRY).code, EXIT.ok);
});

test("13: --voice followed by a flag is a usage error and does not eat the flag", () => {
  const result = cli(["--voice", "--json"], STDIN_ENTRY);
  assert.equal(result.code, EXIT.usage);
  assert.ok(result.err.includes("--voice needs a value"));
  assert.equal(cli(["--disable", "--json"], STDIN_ENTRY).code, EXIT.usage);
});

// ---- 14. the draft skill ----

test("14: the draft skill uses Edit rules, unquoted Bash rules, a per-run directory and a restricted checker rule", () => {
  const skill = read("skills/draft/SKILL.md");
  const allowed = /^allowed-tools:\s*(.*)$/m.exec(skill)?.[1] ?? "";
  assert.ok(!/\bWrite\(/.test(allowed), "a Write rule is dead: use Edit");
  assert.ok(/Edit\(~\/\.claude\/plugins\/data\/foghorn\*\/drafts\/\*\*\)/.test(allowed));
  assert.ok(!allowed.includes("/tmp/"), "no /tmp rule: on macOS /tmp is /private/tmp");
  assert.ok(allowed.includes("Bash(mktemp -d ${CLAUDE_PLUGIN_DATA}/drafts/run.*)"));
  assert.ok(allowed.includes("check-notes.ts * ${CLAUDE_PLUGIN_DATA}/drafts/*)"), "the checker rule must name the scratch directory");
  assert.ok(!allowed.includes("check-notes.ts *)"));
  assert.ok(!skill.includes("/tmp/foghorn"));
  assert.ok(!/node "\$\{CLAUDE_PLUGIN_ROOT\}/.test(skill), "a quoted path does not match the unquoted rule");
  assert.ok(skill.includes("every character outside letters, digits, dot and dash"));
  assert.ok(existsSync(join(ROOT, "scripts/gh-read.ts")));
});
