// A read-only wrapper around the gh command line tool. The draft skill and the collector agent call it as
//   node gh-read.ts --account <login> <subcommand> ...
// so that one permission rule covers every call, and so that no call can write. The wrapper takes only a fixed list of
// read-only subcommands, refuses every flag outside that list, finds the credential of the account itself with
// execFile (no shell), and hands the child a short, named environment. It never prints the credential.
// Exit codes: the exit code of gh when gh ran, 2 when the wrapper refused the call, 1 when the account has no login.
import { spawnSync } from "node:child_process";

const EXIT_REFUSED = 2;
const EXIT_NO_LOGIN = 1;
const ARGV_START = 2; // argv[0] is node, argv[1] is this script
const BYTES_PER_MIB = 1_048_576;
const MAX_MIB = 64;
const MAX_BUFFER = MAX_MIB * BYTES_PER_MIB;
const EXIT_NO_GH = 127;
const MASK = "***";
const NONE = 0;
const ONE = 1;
const TWO = 2;
const ACCOUNT_FLAG = "--account";

// The variables that the child may see, and no others. gh needs a home to find its settings and a PATH to run.
// The proxy names let gh work behind a company proxy. GH_HOST is not on the list: it could point gh at another host.
const NAMED_VARIABLES: readonly string[] = ["PATH", "HOME", "XDG_CONFIG_HOME", "GH_CONFIG_DIR", "USERPROFILE", "APPDATA", "SYSTEMROOT", "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "SSL_CERT_FILE"];
// Fixed settings: no prompt, no update notice, no color, no pager.
const FIXED_VARIABLES = { GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1", NO_COLOR: "1", GH_PAGER: "cat" } as const satisfies Record<string, string>;

// A login of a GitHub account. Matches "gagoar" and "gago-frigerio_pdds"; rejects "a b" and "--user".
const LOGIN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,38}$/;
// A character that a shell reads as syntax. Matches ";" and "$(x)"; rejects "plain words".
const SHELL_SYNTAX = /[;|&`$<>\\(){}\n\r]/;
// A number. Matches "123"; rejects "12a".
const NUMBER = /^\d{1,9}$/;
// A repository. Matches "evanw/esbuild"; rejects "evanw" and "a/b/c".
const REPOSITORY = /^[\w.-]+\/[\w.-]+$/;
// A tag name. Matches "v1.2.3" and "create-vite@9.3.2"; rejects "--web" and "a b".
const TAG = /^[\w][\w.@/+-]{0,99}$/;
// A list of JSON fields. Matches "title,body,author"; rejects "title body".
const FIELDS = /^[A-Za-z]+(?:,[A-Za-z]+)*$/;
// A search text. Matches "abc123 is:merged"; rejects text with a shell character.
const SEARCH = /^[\w .:@/#=<>+-]{1,200}$/;
// A branch or a label. Matches "main" and "release/1.x"; rejects "--x".
const NAME = /^[\w][\w./ -]{0,99}$/;
// A state of a pull request. Matches "merged"; rejects "deleted".
const STATE = /^(?:open|closed|merged|all)$/;
// A count. Matches "50"; rejects "5000000".
const LIMIT = /^\d{1,4}$/;
// The method of a read. Matches "GET"; rejects "POST" and "get".
const METHOD = /^GET$/;
// The path of an API read under one repository. Matches "repos/a/b/releases?per_page=5"; rejects "user", "/repos/a/b/x", "repos/a/b/../../user" and "graphql".
const API_PATH = /^(?!.*\.\.)repos\/[\w.-]+\/[\w.-]+\/[\w./?=&,%:+-]*$/;
// A flag with its value joined by an equals sign. Splits "--json=a,b" into "--json" and "a,b".
const JOINED = /^(--[a-z-]+)=([\s\S]*)$/;
// A flag. Matches "--json" and "-f"; rejects "123".
const FLAG = /^-/;

interface Form {
  // How many positional values the form takes, as a minimum and a maximum, and the pattern each must match.
  readonly min: number;
  readonly max: number;
  readonly positional: RegExp;
  // The flags the form accepts. A pattern means the flag takes a value that must match it. null means a switch.
  readonly flags: Readonly<Record<string, RegExp | null>>;
}

const LIST_FLAGS = { "--repo": REPOSITORY, "--json": FIELDS } as const;

// The only forms that run. A call that is not one of these is refused.
const FORMS = {
  "pr view": { min: NONE, max: ONE, positional: NUMBER, flags: { ...LIST_FLAGS, "--comments": null } },
  "pr list": { min: NONE, max: NONE, positional: NUMBER, flags: { ...LIST_FLAGS, "--search": SEARCH, "--state": STATE, "--limit": LIMIT, "--base": NAME, "--head": NAME, "--label": NAME } },
  "issue view": { min: ONE, max: ONE, positional: NUMBER, flags: { ...LIST_FLAGS, "--comments": null } },
  "release view": { min: NONE, max: ONE, positional: TAG, flags: LIST_FLAGS },
  "release list": { min: NONE, max: NONE, positional: TAG, flags: { ...LIST_FLAGS, "--limit": LIMIT } },
  "repo view": { min: NONE, max: ONE, positional: REPOSITORY, flags: { "--json": FIELDS } },
  api: { min: ONE, max: ONE, positional: API_PATH, flags: { "--method": METHOD, "--paginate": null } },
} as const satisfies Record<string, Form>;

class Refused extends Error {}

const lookup = <T>(table: Readonly<Record<string, T>>, key: string): T | undefined => (Object.hasOwn(table, key) ? table[key] : undefined);

interface Parsed {
  readonly values: readonly string[];
  readonly flags: readonly string[];
}

// Splits the arguments of a form into positional values and flags. A flag outside the list, or a value that does not
// match its pattern, refuses the call.
function parseForm(form: Form, args: readonly string[]): Parsed {
  const [arg, ...rest] = args;
  if (arg === undefined) return { values: [], flags: [] };
  const joined = JOINED.exec(arg);
  const name = joined?.[ONE] ?? arg;
  if (!FLAG.test(arg)) {
    const next = parseForm(form, rest);
    return { values: [arg, ...next.values], flags: next.flags };
  }
  if (!Object.hasOwn(form.flags, name)) throw new Refused(`the flag ${name} is not allowed`);
  const pattern = form.flags[name];
  if (pattern === null || pattern === undefined) {
    const next = parseForm(form, rest);
    return { values: next.values, flags: [name, ...next.flags] };
  }
  const value = joined === null ? rest[NONE] : joined[TWO];
  if (value === undefined || !pattern.test(value)) throw new Refused(`the value of ${name} is not allowed`);
  const next = parseForm(form, joined === null ? rest.slice(ONE) : rest);
  return { values: next.values, flags: [name, ...next.flags] };
}

const keyOf = (args: readonly string[]): string => (args[NONE] === "api" ? "api" : args.slice(NONE, TWO).join(" "));

// The checked arguments for gh, or a refusal.
export function check(args: readonly string[]): readonly string[] {
  if (args.some((arg) => SHELL_SYNTAX.test(arg) && !API_PATH.test(arg))) throw new Refused("an argument holds a shell character");
  const name = keyOf(args);
  const form = lookup<Form>(FORMS, name);
  if (form === undefined) throw new Refused("only read-only forms run: pr view, pr list, issue view, release view, release list, repo view, api repos/<owner>/<repo>/...");
  const rest = args.slice(name === "api" ? ONE : TWO);
  const parsed = parseForm(form, rest);
  const bad = parsed.values.find((value) => !form.positional.test(value));
  if (bad !== undefined) throw new Refused("a value is not allowed here");
  if (parsed.values.length < form.min || parsed.values.length > form.max) throw new Refused(`${name} takes between ${form.min} and ${form.max} values`);
  return args;
}

// The environment of the child: the named variables that exist, the fixed settings, and the credential when given.
export function childEnvironment(login: string | undefined): Readonly<Record<string, string>> {
  const named = NAMED_VARIABLES.flatMap((name) => {
    const value = process.env[name];
    return value === undefined ? [] : [[name, value] as const];
  });
  const granted = login === undefined ? [] : [["GH_TOKEN", login] as const];
  return Object.fromEntries([...named, ...Object.entries(FIXED_VARIABLES), ...granted]);
}

interface Outcome {
  readonly code: number;
  readonly out: string;
  readonly err: string;
}

const mask = (text: string, secret: string): string => (secret === "" ? text : text.split(secret).join(MASK));

// Runs gh with an argument list and the environment given. No shell is involved.
function gh(args: readonly string[], env: Readonly<Record<string, string>>): Outcome {
  const result = spawnSync("gh", [...args], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: MAX_BUFFER });
  return { code: result.status ?? EXIT_NO_GH, out: result.stdout ?? "", err: result.stderr ?? (result.error?.message ?? "") };
}

export function run(argv: readonly string[]): Outcome {
  try {
    const [flag, account, ...args] = argv;
    if (flag !== ACCOUNT_FLAG || account === undefined || !LOGIN.test(account)) throw new Refused(`usage: gh-read.ts ${ACCOUNT_FLAG} <login> <subcommand> ...`);
    const checked = check(args);
    const found = gh(["auth", "token", "--user", account], childEnvironment(undefined));
    const secret = found.out.trim();
    if (found.code !== NONE || secret === "") return { code: EXIT_NO_LOGIN, out: "", err: `gh-read: no login for ${account}` };
    const done = gh(checked, childEnvironment(secret));
    return { code: done.code, out: mask(done.out, secret), err: mask(done.err, secret) };
  } catch (error) {
    if (error instanceof Refused) return { code: EXIT_REFUSED, out: "", err: `gh-read: refused: ${error.message}` };
    throw error;
  }
}

if (import.meta.filename === process.argv[ONE]) {
  const outcome = run(process.argv.slice(ARGV_START));
  process.stdout.write(outcome.out);
  process.stderr.write(outcome.err.endsWith("\n") || outcome.err === "" ? outcome.err : `${outcome.err}\n`);
  process.exitCode = outcome.code;
}
