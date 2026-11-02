// The command line of check-notes: arguments in, a report and an exit code out.
import { readFileSync } from "node:fs";
import { AT_SIGN, CHECK_IDS as KNOWN_CHECKS, REPO_NAME, runChecks } from "./notes-checks.ts";
import { parse } from "./notes-parse.ts";
import { failed, summarize, toJSON, toText, type FileReport } from "./notes-report.ts";
import { DEFAULT_PRESET, loadVoice, renamedTo } from "./notes-voice.ts";

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;
const STDIN = 0;
const STDIN_NAME = "<stdin>";

const USAGE = `usage: check-notes [--json] [--voice <preset|path>] [--disable a,b] [--repo owner/name] [--handles a,b] [FILE...]

Reads FILE arguments, or stdin when there are none. Exit 0 when no hard check fails,
1 when one does, 2 for a usage error.

--voice picks a preset (foghorn, esbuild, neutral) or the path of a voice file. Default: ${DEFAULT_PRESET}.
--repo owner/name limits the trace of an entry to that repository.
--handles a,b lists the people the API named (authors and reporters). A credit to anyone else fails credit-unverified.
--disable silences checks by id. The ids: ${KNOWN_CHECKS.join(", ")}.`;

class UsageError extends Error {}

// A GitHub handle. Matches "alice" and "sapphi-red"; rejects "" and "a b".
const HANDLE_NAME = /^[\w-]+$/;
// A flag. Matches "--json" and "-h"; rejects "RELEASE.md".
const FLAG = /^-/;

interface Options {
  readonly json: boolean;
  readonly help: boolean;
  readonly voice: string;
  readonly disable: readonly string[];
  readonly repo: string | undefined;
  readonly handles: readonly string[] | undefined;
  readonly paths: readonly string[];
}

const DEFAULTS: Options = { json: false, help: false, voice: DEFAULT_PRESET, disable: [], repo: undefined, handles: undefined, paths: [] };

type ValueFlag = (value: string, options: Options) => Options;

const VALUE_FLAGS = {
  "--voice": (value, options) => ({ ...options, voice: value }),
  "--disable": (value, options) => {
    const ids = value.split(",");
    const unknown = ids.filter((id) => !KNOWN_CHECKS.includes(id));
    if (unknown.length) throw new UsageError(`unknown check ${unknown.join(", ")}`);
    return { ...options, disable: ids };
  },
  "--repo": (value, options) => {
    if (!REPO_NAME.test(value)) throw new UsageError(`--repo needs owner/name, got ${value}`);
    return { ...options, repo: value };
  },
  "--handles": (value, options) => {
    const handles = value.split(",").map((handle) => handle.trim().replace(AT_SIGN, ""));
    if (!handles.every((handle) => HANDLE_NAME.test(handle))) throw new UsageError("--handles needs a comma-separated list of GitHub handles");
    return { ...options, handles };
  },
} as const satisfies Record<string, ValueFlag>;

const SWITCHES = {
  "--json": (options) => ({ ...options, json: true }),
  "-h": (options) => ({ ...options, help: true }),
  "--help": (options) => ({ ...options, help: true }),
} as const satisfies Record<string, (options: Options) => Options>;

function lookup<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

function parseArgs(argv: readonly string[], options: Options = DEFAULTS): Options {
  const [arg, ...rest] = argv;
  if (arg === undefined) return options;
  const valueFlag = lookup(VALUE_FLAGS, arg);
  if (valueFlag) {
    const [value, ...after] = rest;
    if (value === undefined || FLAG.test(value)) throw new UsageError(`${arg} needs a value`);
    return parseArgs(after, valueFlag(value, options));
  }
  const toggle = lookup(SWITCHES, arg);
  if (toggle) return parseArgs(rest, toggle(options));
  if (arg.startsWith("--")) throw new UsageError(`unknown flag ${arg}`);
  return parseArgs(rest, { ...options, paths: [...options.paths, arg] });
}

export interface Io {
  readonly stdin: () => string;
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}

const SYSTEM_IO: Io = {
  stdin: () => readFileSync(STDIN, "utf8"),
  out: (text) => process.stdout.write(`${text}\n`),
  err: (text) => process.stderr.write(`${text}\n`),
};

export function run(argv: readonly string[], io: Io = SYSTEM_IO): number {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      io.out(USAGE);
      return EXIT_OK;
    }
    const renamed = renamedTo(options.voice);
    if (renamed) io.err(`check-notes: the voice ${options.voice} is renamed to ${renamed}. The old name still works.`);
    const voice = loadVoice(options.voice);
    const sources: readonly (readonly [string, string])[] = options.paths.length
      ? options.paths.map((path) => [path, readFileSync(path, "utf8")] as const)
      : [[STDIN_NAME, io.stdin()]];
    const files: readonly FileReport[] = sources.map(([file, text]) => ({ file, findings: runChecks(parse(text), voice, options.disable, { repo: options.repo, handles: options.handles }) }));
    const report = summarize(voice.name, files);
    io.out(options.json ? toJSON(report) : toText(report));
    return failed(report) ? EXIT_FAILED : EXIT_OK;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.err(error instanceof UsageError ? `check-notes: ${message}\n${USAGE}` : `check-notes: ${message}`);
    return EXIT_USAGE;
  }
}
