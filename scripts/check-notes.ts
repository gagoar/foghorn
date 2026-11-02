// The entry point of the release-notes checker. The work is in notes-cli.ts.
import { run } from "./notes-cli.ts";

const ARGV_START = 2; // argv[0] is node, argv[1] is this script

process.exitCode = run(process.argv.slice(ARGV_START));
