import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CHECKS, CHECK_IDS, Severity } from "../scripts/notes-checks.ts";
import { parse } from "../scripts/notes-parse.ts";
import { PRESETS, loadVoice, validateVoice } from "../scripts/notes-voice.ts";
import { cli, read, ROOT } from "./helpers.ts";

// The suffix of a rule fixture. Replaced with nothing: "emoji.pass.md" → "emoji"; "emoji.md" is unchanged.
const FIXTURE_SUFFIX = /\.(?:pass|fail)\.md$/;
const BREAKING = "breaking-no-preface";
const BEHAVIOR = "behavior-no-example";
const TRACE = "entry-no-link-or-credit";
const DEFAULT_VOICE = "esbuild-plus";
const CREDIT = "credit-unverified";
const BUG = "* Fix a bug\n";
const OPTIONAL_KEYS = ["creditOwner", "severity"] as const;
const MIN_PROBLEMS = 1;
const EXIT = { ok: 0, failed: 1, usage: 2 } as const;
const VOICE_FIXTURES = 10;
const BAD_FIXTURES = 5;
const MAX_EXCERPT_CHARS = 1500;
// The source comment that opens a voice fixture. Matches "<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.1.0 (excerpt) -->"; rejects "<!-- note -->".
const SOURCE_COMMENT = /^<!-- source: https:\/\/github\.com\/evanw\/esbuild\/releases\/tag\/v[\d.]+ \(excerpt\) -->\n/;

const ruleFile = (id: string, kind: "pass" | "fail"): string => `testdata/rules/${id}.${kind}.md`;

// Checks that run only when the caller gives what they need. The fixtures of these run with those arguments.
const EXTRA_ARGS = { [CREDIT]: ["--handles", "alice,bob"] } as const satisfies Record<string, readonly string[]>;

function count(path: string, id: string, voice = DEFAULT_VOICE): number {
  const report: { files: { findings: { check: string }[] }[] } = JSON.parse(cli(["--json", "--voice", voice, ...(Object.hasOwn(EXTRA_ARGS, id) ? EXTRA_ARGS[id as typeof CREDIT] : []), `${ROOT}/${path}`]).out);
  return report.files[0]?.findings.filter((f) => f.check === id).length ?? 0;
}

test("every check has a pass and a fail fixture", () => {
  CHECK_IDS.forEach((id) => {
    assert.ok(existsSync(join(ROOT, ruleFile(id, "pass"))), `${id} has no pass fixture`);
    assert.ok(existsSync(join(ROOT, ruleFile(id, "fail"))), `${id} has no fail fixture`);
  });
  const ids = readdirSync(`${ROOT}/testdata/rules`).map((name) => name.replace(FIXTURE_SUFFIX, ""));
  ids.forEach((id) => assert.ok(CHECK_IDS.includes(id), `testdata/rules/${id} names no check`));
});

test("a pass fixture has no finding for its check, and a fail fixture has at least one", () => {
  CHECK_IDS.forEach((id) => {
    assert.equal(count(ruleFile(id, "pass"), id), 0, `${id} pass`);
    assert.ok(count(ruleFile(id, "fail"), id) >= 1, `${id} fail`);
  });
});

test("the hard checks are the hard ones: three always, and one that needs --handles", () => {
  const hard = CHECKS.filter((c) => c.severity === Severity.Hard).map((c) => c.id);
  assert.deepEqual(hard, [BREAKING, BEHAVIOR, TRACE, CREDIT]);
});

test("the esbuild fixtures are short quotes with a source, and the esbuild preset has no hard failure on them", () => {
  const names = readdirSync(`${ROOT}/testdata/voice`).filter((name) => name.endsWith(".md"));
  assert.equal(names.length, VOICE_FIXTURES);
  names.forEach((name) => {
    const path = `testdata/voice/${name}`;
    const text = read(path);
    assert.ok(SOURCE_COMMENT.test(text), `${path} must start with the source comment`);
    assert.ok(text.length <= MAX_EXCERPT_CHARS + text.indexOf("\n"), `${path} is longer than an excerpt`);
    const result = cli(["--voice", "esbuild", `${ROOT}/${path}`]);
    assert.equal(result.code, EXIT.ok, `${path}\n${result.out}`);
  });
});

const BAD_EXPECTED = {
  "breaking-no-preface.md": [BREAKING],
  "behavior-no-example.md": [BEHAVIOR],
  "entry-no-link-or-credit.md": [TRACE],
  "vague-generated.md": [TRACE],
  "breaking-and-behavior.md": [BREAKING, BEHAVIOR],
} as const satisfies Record<string, readonly string[]>;

test("the bad drafts fail the right hard check", () => {
  assert.equal(Object.keys(BAD_EXPECTED).length, BAD_FIXTURES);
  Object.entries(BAD_EXPECTED).forEach(([name, expected]) => {
    const result = cli(["--json", `${ROOT}/testdata/bad/${name}`]);
    assert.equal(result.code, EXIT.failed, name);
    const report: { files: { findings: { check: string; severity: string }[] }[] } = JSON.parse(result.out);
    const hard = new Set(report.files[0]?.findings.filter((f) => f.severity === Severity.Hard).map((f) => f.check));
    expected.forEach((id) => assert.ok(hard.has(id), `${name} should fail ${id}`));
  });
});

test("the CLI reads stdin, honors --disable and reports exit codes", () => {
  assert.equal(cli([], BUG).code, EXIT.failed);
  assert.equal(cli(["--disable", TRACE], BUG).code, EXIT.ok);
  assert.equal(cli(["--bogus"]).code, EXIT.usage);
  assert.equal(cli(["--disable", "nope"]).code, EXIT.usage);
  assert.equal(cli(["--voice"]).code, EXIT.usage);
  assert.equal(cli(["--voice", "missing-preset-file.json"]).code, EXIT.usage);
  assert.equal(cli(["--help"]).code, EXIT.ok);
});

test("--json has the documented shape", () => {
  const result = cli(["--json", "--voice", "neutral"], BUG);
  const report: { voice: string; hard: number; warn: number; files: { file: string; findings: Record<string, unknown>[] }[] } = JSON.parse(result.out);
  assert.equal(report.voice, "neutral");
  assert.equal(report.files[0]?.file, "<stdin>");
  assert.equal(report.hard, 1);
  assert.deepEqual(Object.keys(report.files[0]?.findings[0] ?? {}).sort(), ["check", "line", "message", "severity"]);
});

test("a voice preset validates, and the checker obeys it", () => {
  PRESETS.forEach((name) => assert.deepEqual(validateVoice(loadVoice(name)), [], name));
  assert.deepEqual(validateVoice(JSON.parse(read("foghorn.voice.example.json"))), []);
  assert.ok(validateVoice({ name: "x" }).length > MIN_PROBLEMS);
  assert.ok(validateVoice({ ...loadVoice("esbuild"), person: "second" }).length >= MIN_PROBLEMS);
  assert.ok(validateVoice({ ...loadVoice("esbuild"), extra: 1 }).length >= MIN_PROBLEMS);
  const text = "* Raise the Node requirement ([#1](https://example.invalid/a/b/issues/1))\n\n    The tool now requires Node 14.\n";
  assert.equal(JSON.stringify(cli(["--voice", "esbuild", "--json"], text).out).includes("affects-line-missing"), false);
  assert.equal(JSON.stringify(cli(["--voice", DEFAULT_VOICE, "--json"], text).out).includes("affects-line-missing"), true);
});

test("the schema and the validator name the same keys", () => {
  const schema: { required: string[]; properties: Record<string, unknown> } = JSON.parse(read("schema/foghorn-voice.schema.json"));
  assert.deepEqual(Object.keys(schema.properties).sort(), Object.keys(loadVoice("esbuild")).sort());
  assert.deepEqual([...schema.required, ...OPTIONAL_KEYS].sort(), Object.keys(schema.properties).sort());
});

test("a voice can soften a check, and the esbuild preset softens the one that esbuild breaks", () => {
  const untraced = "## v1.0.0 (2025-01-01)\n\n* Update the Go compiler\n\n    Previously the build used 1.25. With this release, it uses 1.26.\n";
  const levelUnder = (voice: string): string | undefined => {
    const report: { files: { findings: { check: string; severity: string }[] }[] } = JSON.parse(cli(["--json", "--voice", voice], untraced).out);
    return report.files[0]?.findings.find((f) => f.check === TRACE)?.severity;
  };
  assert.equal(levelUnder("esbuild"), Severity.Warn);
  assert.equal(levelUnder(DEFAULT_VOICE), Severity.Hard);
  assert.equal(levelUnder("neutral"), Severity.Hard);
});

test("the validator rejects a bad severity map and a bad creditOwner", () => {
  const base = loadVoice(DEFAULT_VOICE);
  assert.deepEqual(validateVoice({ ...base, severity: { [TRACE]: "warn" }, creditOwner: true }), []);
  assert.ok(validateVoice({ ...base, severity: { "no-such-check": "warn" } }).length >= MIN_PROBLEMS);
  assert.ok(validateVoice({ ...base, severity: { [TRACE]: "loud" } }).length >= MIN_PROBLEMS);
  assert.ok(validateVoice({ ...base, creditOwner: "yes" }).length >= MIN_PROBLEMS);
});

test("no preset credits the owner of the repository by default", () => {
  PRESETS.forEach((name) => assert.equal(loadVoice(name).creditOwner, false, name));
});

test("the parser finds entries, a preface and labeled blocks", () => {
  const notes = parse(read(ruleFile("breaking-no-preface", "pass")));
  assert.equal(notes.entries.length, 1);
  assert.ok(notes.preface.includes("backwards-incompatible"));
  assert.equal(parse(read(ruleFile("behavior-no-example", "pass"))).entries[0]?.blocks.length, 1);
});
