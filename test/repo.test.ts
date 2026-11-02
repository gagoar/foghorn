import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { cli, files, read, ROOT } from "./helpers.ts";

const MAX_TEXT_BYTES = 256 * 1024;
const MIN_SKILLS = 3;
const FRONTMATTER = /^---\n([\s\S]*?)\n---/;

interface Manifest {
  readonly version: string;
  readonly skills: readonly string[];
}

const manifest: Manifest = JSON.parse(read(".claude-plugin/plugin.json"));

// The name and description keys of a frontmatter block. Matches "name: draft" → ("name"); rejects "  - item".
const KEY = /^([a-z-]+):/gm;

test("plugin.json skills paths exist and each SKILL.md has a name and a description", () => {
  assert.ok(manifest.skills.length >= MIN_SKILLS);
  manifest.skills.forEach((dir) => {
    assert.ok(existsSync(`${ROOT}/${dir}/SKILL.md`), `${dir}/SKILL.md is missing`);
    const front = FRONTMATTER.exec(read(`${dir}/SKILL.md`))?.[1] ?? "";
    const keys = new Set([...front.matchAll(KEY)].map((m) => m[1]));
    assert.ok(keys.has("name") && keys.has("description"), `${dir} needs name and description`);
  });
});

test("versions match across plugin.json and package.json, and the plugin has no marketplace file of its own", () => {
  const pkg: { version: string } = JSON.parse(read("package.json"));
  assert.equal(manifest.version, pkg.version);
  assert.equal(existsSync(`${ROOT}/.claude-plugin/marketplace.json`), false);
});

test("no file is over 256 KiB and no top-level bin directory exists", () => {
  files().forEach(({ path, bytes }) => assert.ok(bytes <= MAX_TEXT_BYTES || path.endsWith(".png"), `${path} is over 256 KiB`));
  assert.ok(!files().some(({ path }) => path.startsWith("bin/")));
});

test("the package declares no dependency", () => {
  const pkg: Record<string, unknown> = JSON.parse(read("package.json"));
  assert.deepEqual([pkg["dependencies"], pkg["devDependencies"], pkg["type"]], [undefined, undefined, "module"]);
});

const TESTER_HOST = /regex(?:\d+|r)\.com/;
const CODE_FILE = /^(?:scripts|test)\/.*\.ts$/;
const GATE = "scripts/check-plugin-safety.ts";
const SELF = "test/repo.test.ts";
// A named regex at the top level of a file. Matches "const SEMVER = /^a$/;" → ("SEMVER"); rejects "const x = 1;".
const REGEX_DECLARATION = /^(?:export )?const (\w+)(?:: RegExp)? = \//gm;
// A row of REGEXES.md. Matches "| `scripts/x.ts` | `SEMVER` |" → ("scripts/x.ts", "SEMVER"); rejects a heading.
const REGEX_ROW = /^\| `([^`]+)` \| `([^`]+)` \|/gm;

// The directory scan holds a plugin for review when a code file has a remote URL beside a credential word, so tester links live in REGEXES.md.
// The gate is the canonical copy shared with other plugins and is not in this table.
test("code carries no tester link, and REGEXES.md lists every regex", () => {
  const sources = files().map(({ path }) => path).filter((path) => CODE_FILE.test(path) && path !== GATE);
  sources.filter((path) => path !== SELF).forEach((path) => assert.ok(!TESTER_HOST.test(read(path)), `${path} has a tester link`));
  const rows = new Set([...read("REGEXES.md").matchAll(REGEX_ROW)].map((m) => `${m[1]}:${m[2]}`));
  const declared = sources.flatMap((path) => [...read(path).matchAll(REGEX_DECLARATION)].map((m) => `${path}:${m[1]}`));
  declared.forEach((entry) => assert.ok(rows.has(entry), `${entry} has no row in REGEXES.md`));
  rows.forEach((entry) => assert.ok(declared.includes(entry), `${entry} in REGEXES.md names no regex`));
});

// The agent file asks for no write tool and removes the ones it can. Claude Code does not enforce a command pattern
// in a `tools` line, so the test also checks that no document claims the agent file enforces read-only.
const REMOVED_TOOLS = ["Write", "Edit", "NotebookEdit", "Skill", "Agent"];

test("the agent removes the write tools, the Skill tool and the Agent tool, and no document claims that the agent file enforces read-only", () => {
  const text = read("agents/foghorn-collector.md");
  const front = FRONTMATTER.exec(text)?.[1] ?? "";
  const removed = (/^disallowedTools:\s*(.*)$/m.exec(front)?.[1] ?? "").split(",").map((tool) => tool.trim());
  assert.deepEqual(removed, REMOVED_TOOLS);
  const tools = /^tools:.*$/m.exec(front)?.[0] ?? "";
  assert.ok(!/\b(?:Write|Edit|NotebookEdit|Skill|Agent)\b/.test(tools));
  assert.ok(!tools.includes("Bash(gh "), "no raw gh in the tools line");
  assert.ok(text.includes("does not enforce a command pattern"), "the agent must say that its tools line is not enforced");
  ["README.md", "AGENTS.md", "skills/draft/SKILL.md"].forEach((path) => {
    const doc = read(path);
    assert.ok(/permission mode/i.test(doc), `${path} must say that read-only comes from the permission mode and rules`);
    assert.ok(!/collector (?:agent )?has no write tool/i.test(doc), `${path} still claims the agent file enforces read-only`);
  });
});

// A blockquote line. Replaced with the text after the marker: "> text" → "text"; "text" is unchanged.
const QUOTE_MARKER = /^> ?/;

test("the README After text is a real fixture, and the checker passes it", () => {
  const readme = read("README.md");
  const after = readme.split("\n").filter((line) => line.startsWith(">")).map((line) => line.replace(QUOTE_MARKER, "")).join("\n").trim();
  const fixture = read("testdata/showcase/tpe-0.6.0.md");
  assert.ok(fixture.includes(after), "the After text must be a quote of the fixture");
  assert.equal(cli(["--voice", "foghorn", `${ROOT}/testdata/showcase/tpe-0.6.0.md`]).code, 0);
  assert.ok(readme.includes("## Privacy") && readme.includes("## Terms"));
});
