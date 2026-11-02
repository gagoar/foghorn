import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT } from "./helpers.ts";

const WRAPPER = join(ROOT, "scripts/gh-read.ts");
const EXECUTABLE = 0o755;
const ACCOUNT = "--account";
const SEARCH_FLAG = "--search";
const METHOD_FLAG = "--method";
const ISSUES = "repos/o/r/issues";
const FAKE_VALUE = "tok_unit_test_value";
const EXIT = { ok: 0, noLogin: 1, refused: 2 } as const;

// A fake gh. It logs its arguments and the variables it sees to a file, since the wrapper gives the child a named environment only. `auth token` prints the test credential for "alice" only.
const fakeGh = (log: string): string => `#!/bin/sh
echo "ARGS:$*" >> "${log}"
echo "SEEN_LEAK:$LEAK_ME" >> "${log}"
echo "SEEN_GH:$GH_TOKEN" >> "${log}"
if [ "$1" = "auth" ]; then
  if [ "$4" = "alice" ]; then echo "${FAKE_VALUE}"; exit 0; fi
  exit 1
fi
echo "output uses ${FAKE_VALUE} once"
exit 0
`;

interface Setup {
  readonly dir: string;
  readonly log: string;
}

function setup(): Setup {
  const dir = mkdtempSync(join(tmpdir(), "foghorn-gh-"));
  const log = join(dir, "log.txt");
  writeFileSync(join(dir, "gh"), fakeGh(log));
  chmodSync(join(dir, "gh"), EXECUTABLE);
  return { dir, log };
}

function call(args: readonly string[], fake: Setup = setup()): { readonly code: number; readonly out: string; readonly err: string; readonly log: string } {
  const result = spawnSync("node", [WRAPPER, ...args], {
    encoding: "utf8",
    env: { PATH: `${fake.dir}:${process.env["PATH"] ?? ""}`, HOME: fake.dir, LEAK_ME: "secret-from-parent" },
  });
  const log = (() => {
    try {
      return readFileSync(fake.log, "utf8");
    } catch {
      return "";
    }
  })();
  return { code: result.status ?? -1, out: result.stdout, err: result.stderr, log };
}

const ALLOWED: readonly (readonly string[])[] = [
  ["pr", "view", "12", "--json", "title,body,author", "--repo", "o/r"],
  ["pr", "list", SEARCH_FLAG, "abc123 is:merged", "--state", "merged", "--limit", "20"],
  ["issue", "view", "7", "--json", "title,author"],
  ["release", "view", "v1.2.3"],
  ["release", "list", "--limit", "5"],
  ["repo", "view", "o/r", "--json", "owner"],
  ["api", "repos/o/r/releases?per_page=5&page=2"],
  ["api", "repos/o/r/pulls/3", METHOD_FLAG, "GET"],
];

test("gh-read runs each read-only form with the credential of the named account", () => {
  ALLOWED.forEach((args) => {
    const result = call([ACCOUNT, "alice", ...args]);
    assert.equal(result.code, EXIT.ok, `${args.join(" ")}\n${result.err}`);
    assert.ok(result.log.includes(`ARGS:${args.join(" ")}`), args.join(" "));
  });
});

test("gh-read never prints the credential, and gives the child only a named environment", () => {
  const result = call([ACCOUNT, "alice", "pr", "view", "1"]);
  assert.ok(!result.out.includes(FAKE_VALUE) && !result.err.includes(FAKE_VALUE));
  assert.ok(result.out.includes("***"));
  assert.ok(result.log.includes(`SEEN_GH:${FAKE_VALUE}`));
  assert.ok(!result.log.includes("secret-from-parent"), "the child saw a variable that is not on the list");
});

const REFUSED: readonly (readonly string[])[] = [
  ["pr", "create", "--title", "x"],
  ["pr", "merge", "1"],
  ["pr", "comment", "1", "--body", "x"],
  ["pr", "view", "1", "--web"],
  ["pr", "view", "1", "--jq", "env"],
  ["pr", "view", "1", "--hostname", "evil.example"],
  ["issue", "close", "1"],
  ["release", "create", "v1"],
  ["release", "delete", "v1"],
  ["repo", "delete", "o/r"],
  ["repo", "view", "o/r", "--web"],
  ["auth", "token"],
  ["auth", "status"],
  ["api", "user"],
  ["api", "graphql"],
  ["api", "/repos/o/r/issues"],
  ["api", "repos/o/r/../../user"],
  ["api", ISSUES, "-f", "title=x"],
  ["api", ISSUES, "-F", "title=x"],
  ["api", ISSUES, "--field", "title=x"],
  ["api", ISSUES, "--raw-field", "title=x"],
  ["api", ISSUES, "--input", "x.json"],
  ["api", ISSUES, METHOD_FLAG, "POST"],
  ["api", ISSUES, METHOD_FLAG, "PATCH"],
  ["api", ISSUES, "-X", "DELETE"],
  ["api", ISSUES, "-H", "X-HTTP-Method-Override: DELETE"],
  ["api", "repos/o/r/x;rm"],
  ["pr", "view", "1;rm"],
  ["pr", "view", "$(id)"],
  ["pr", "list", SEARCH_FLAG, "a|b"],
  ["pr", "list", SEARCH_FLAG, "`id`"],
  ["issue", "view", "1", "--repo", "a/b/c"],
  ["alias", "set", "x", "pr merge"],
  ["extension", "install", "o/r"],
  ["secret", "list"],
  ["pr"],
  [],
];

test("gh-read refuses every other subcommand, every writing flag and every shell character, with exit 2", () => {
  REFUSED.forEach((args) => {
    const fake = setup();
    const result = call([ACCOUNT, "alice", ...args], fake);
    assert.equal(result.code, EXIT.refused, args.join(" "));
    assert.ok(!result.log.includes("ARGS:"), `gh ran for: ${args.join(" ")}`);
  });
});

test("gh-read needs a valid account, and says so when the account has no login", () => {
  assert.equal(call(["pr", "view", "1"]).code, EXIT.refused);
  assert.equal(call([ACCOUNT, "--user", "pr", "view", "1"]).code, EXIT.refused);
  assert.equal(call([ACCOUNT, "a b", "pr", "view", "1"]).code, EXIT.refused);
  const nobody = call([ACCOUNT, "bob", "pr", "view", "1"]);
  assert.equal(nobody.code, EXIT.noLogin);
  assert.ok(!nobody.log.includes("ARGS:pr"), "gh ran a read for an account with no login");
});

test("the skill and the collector call gh through the wrapper, and allow only that", () => {
  const skill = readFileSync(join(ROOT, "skills/draft/SKILL.md"), "utf8");
  const agent = readFileSync(join(ROOT, "agents/foghorn-collector.md"), "utf8");
  [skill, agent].forEach((text) => {
    assert.ok(text.includes("scripts/gh-read.ts"));
    assert.ok(!/GH_TOKEN=\$\(gh auth token/.test(text), "the old token form is still in the file");
    assert.ok(!/Bash\(gh /.test(text), "a Bash(gh ...) rule is still in the file");
  });
});
