import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../scripts/notes-cli.ts";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export interface CliResult {
  readonly code: number;
  readonly out: string;
  readonly err: string;
}

// Runs the CLI in process. Returns the exit code and what it printed.
export function cli(args: readonly string[], stdin = ""): CliResult {
  const out: string[] = [];
  const err: string[] = [];
  const code = run(args, { stdin: () => stdin, out: (text) => out.push(text), err: (text) => err.push(text) });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

export const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

const SKIPPED = new Set([".git", "node_modules"]);

// Every file of the repository as a path relative to the root, with its size.
export function files(dir = ""): readonly { readonly path: string; readonly bytes: number }[] {
  return readdirSync(join(ROOT, dir)).filter((name) => !SKIPPED.has(name)).flatMap((name) => {
    const path = dir ? `${dir}/${name}` : name;
    const info = statSync(join(ROOT, path));
    return info.isDirectory() ? files(path) : [{ path, bytes: info.size }];
  });
}
