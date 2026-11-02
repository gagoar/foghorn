---
name: check
description: >
  /foghorn:check — Run the foghorn checker on an existing release-notes file and explain each finding in plain
  words. It changes nothing unless you ask. Trigger on "/foghorn:check <file>", "check these release notes",
  "lint my changelog", "does this release note follow the voice", "why did the notes check fail".
argument-hint: "<file> [--voice <preset|path>] [--disable a,b]"
allowed-tools: Read, Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/check-notes.ts:*)
---

# /foghorn:check

Check a release-notes file against the voice. Report. Do not rewrite unless the user asks.

## Steps

1. Take the file path from the arguments. If there is none, ask for it.
2. Run the checker. The default voice is `esbuild-plus`:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/check-notes.ts" --json <file>
   ```

   Add `--voice <preset|path>` or `--disable a,b` when the user gave them. If a `foghorn.voice.json` sits in the repository, ask whether to use it.
3. Read the JSON. Exit code 1 means at least one hard failure. Exit code 2 means a usage error: show the message.
4. Explain each finding in one or two sentences, hard failures first. Quote the entry title. Say what the rule wants and what would satisfy it. The rules:

   | Check | Level | What it wants |
   |---|---|---|
   | `breaking-no-preface` | hard | A breaking release opens with the preface line and pinning advice. |
   | `behavior-no-example` | hard | An entry that says "previously" or "now" shows the old and the new output. |
   | `entry-no-link-or-credit` | hard | Every entry links an issue, a pull request or an advisory, or credits a handle. |
   | `credit-unverified` | hard | Runs only with `--handles a,b`: every credited handle is one the API named. |
   | `unlabeled-code-block` | warn | A code block has a label, such as "Original code" or "Old output". |
   | `marketing-word` | warn | No word from the voice's banned list. |
   | `entry-too-long` | warn | An entry stays under the voice's `maxEntryChars`. |
   | `missing-version-or-date` | warn | The header names a version and a date. |
   | `affects-line-missing` | warn | A risky entry has an `Affects:` line (voices with `affectsLine`). |
   | `padding` | warn | No filler opener such as "We're excited". |
   | `emoji` | warn | No emoji. |

5. If the file is a raw GitHub release body, the header has no version or date. Say so: the warning is expected there.
6. End with the counts. Offer to fix the findings. Fix only when the user says yes. When you fix, never invent an example: read or run the code, or write the entry without one and say so.

A hedge such as "in theory" or "hopefully" is content. Do not flag it and do not remove it.
