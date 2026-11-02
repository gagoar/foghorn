---
name: voice
description: >
  /foghorn:voice — Show, pick or edit the voice of your release notes. Three presets: foghorn (the default: first
  person, with optional Affects and To check lines), esbuild (the preset calibrated on esbuild's own release
  notes) and neutral (third person). Trigger on "/foghorn:voice", "change the release notes voice", "use the
  foghorn voice", "write notes in third person", "edit the foghorn voice".
argument-hint: "[show | pick <preset> | edit]"
allowed-tools: Read, Write(./foghorn.voice.json), Edit(./foghorn.voice.json), AskUserQuestion, Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/check-notes.ts:*)
---

# /foghorn:voice

The voice is a JSON object. The presets live in `${CLAUDE_PLUGIN_ROOT}/skills/voice/presets/`. The schema is `${CLAUDE_PLUGIN_ROOT}/schema/foghorn-voice.schema.json`. The patterns behind the presets are in `references/patterns.md`.

## show

Read `./foghorn.voice.json` if it exists, otherwise the `foghorn` preset. Print its fields in a short table: person, creditStyle, affectsLine, maxEntryChars, the three example labels, the openers and the count of banned words.

## pick

1. If the user did not name a preset, ask with AskUserQuestion:
   - `foghorn` (default): first person, with optional `Affects:` and `To check:` lines.
   - `esbuild`: the preset calibrated on esbuild's own release notes; the ten hand-cut excerpts pass it with no hard failure. No `Affects:` line.
   - `neutral`: third person. Credits as "Reported by @x. Fixed by @y."
2. Read the preset file. Write it to `./foghorn.voice.json` in the current directory. Ask before you overwrite an existing file. Do not write into any other place.
3. Tell the user the checker takes it with `--voice ./foghorn.voice.json`.

## edit

1. Read `./foghorn.voice.json`. If it does not exist, start from `foghorn` and say so.
2. Ask what to change. Only these fields exist: `person`, `creditStyle`, `prefaceRules`, `exampleStyle.labels`, `affectsLine`, `maxEntryChars`, `openers`, `bannedWords`. Refuse a field that is not in the schema.
3. Apply the change with Edit. Keep the JSON valid.
4. Validate by running the checker with the voice on a fixture that ships with the plugin: `node ${CLAUDE_PLUGIN_ROOT}/scripts/check-notes.ts --voice ./foghorn.voice.json ${CLAUDE_PLUGIN_ROOT}/testdata/rules/emoji.pass.md`. An invalid voice exits with code 2 and prints the problem. Show it if it does.

Raising `maxEntryChars` hides a real problem: ask for the reason first. Removing a word from `bannedWords` is fine.
