<img src=".claude-plugin/icon.png" alt="foghorn icon" width="120" align="right">

# foghorn

**Release notes that the people affected want to read: technical, honest, and checked by code.**

foghorn is a release notes generator for Claude Code. It drafts technical release notes for a tag range: what changed for a user, the old and new output, who is affected and how to check, and credit for the people who helped. A checker fails notes that skip these facts.

Agents read release notes now too. A person still has to follow a note when an upgrade breaks something, and still wants to remember what went out. GitHub's `--generate-notes` writes one line per pull request. foghorn writes a note that you can follow. It never publishes: you read the draft and you publish it. It belongs to the same story as [greenhorn](https://github.com/gagoar/greenhorn), a way into the pull request.

[Docs](https://gagoar.github.io/foghorn/): a real run, the voice, and the guide.

## Before and after

| Before: a line of a real generated note | After: an entry in the foghorn voice |
|---|---|
| `* trim only ascii whitespace for branch by @aiqiaoy in https://github.com/actions/checkout/pull/2521` | See the entry below. |

Before is one line from the release text of actions/checkout v7.0.1, made by `--generate-notes`. It says what a pull request was called. It does not say what changed for you.

After is an entry from a foghorn draft for typescript-patterns-enforcer v0.6.0. The checker passes it with the `foghorn` voice (no hard failure):

> * Stop the magic-number check from flagging numbers inside a named constant ([#35](https://github.com/gagoar/typescript-patterns-enforcer/pull/35))
>
>     Previously the check flagged every number in an arithmetic expression, even when the expression is the initial value of a `const` that names the result. The check also flagged a number inside an `as const` table, although the table is the named constant.
>
>     With this release, the check skips a number in the arithmetic of a `const` initializer and a number inside an `as const` literal. This is a deliberate difference from typescript-eslint, which exempts only a bare initializer.

These are two different changes. The table shows the shape of a note, not a rewrite of one change. foghorn does not rewrite old notes. A test checks that the After text is the text of `testdata/showcase/tpe-0.6.0.md`, the full draft.

## Install

```
/plugin marketplace add gagoar/gago-plugins
/plugin install foghorn@gago-plugins
```

A foghorn is a loud signal that tells people what is ahead. The plugin is named for what release notes do.

foghorn needs two other plugins for the prose step: `unmistakable` (the `asd-ste100` skill) and `iceberg` (`iceberg:edit`). Both come from the same marketplace:

```
/plugin install unmistakable@gago-plugins
/plugin install iceberg@gago-plugins
```

## Use

| Command | What it does |
|---|---|
| `/foghorn:draft v1.2.0..v1.3.0` | Collects the changes of the range, drafts the notes, checks them, polishes them. |
| `/foghorn:check RELEASE.md` | Runs the checker on a file and explains each finding. It changes nothing. |
| `/foghorn:voice` | Shows, picks or edits the voice. |

The checker runs without Claude too. Node 22.18 or later:

```
node scripts/check-notes.ts --voice foghorn RELEASE.md
node scripts/check-notes.ts --json --disable padding,emoji < RELEASE.md
```

Exit code 0: no hard failure. Exit code 1: a hard failure. Exit code 2: a usage error.

## What the checker enforces

Three hard checks fail the run on their own. A fourth runs only when the caller says whom the API named:

- `breaking-no-preface`: a release that says it is breaking has no preface line.
- `behavior-no-example`: an entry says "previously" or "now" and shows no old and new output.
- `entry-no-link-or-credit`: an entry has no issue, pull request or advisory link and no credit by handle. A trace is `#12` in parentheses or brackets, a link to a pull request, an issue or a commit on GitHub, or a GHSA or CVE id. `F#3`, a color and "#1 priority" are not traces, and "Not fixed by @bob" is not a credit.
- `credit-unverified` (only with `--handles a,b`): a credited `@handle` that is not in the list. The draft skill passes the authors and reporters that the API returned.

`--repo owner/name` limits the trace to links on that repository: a link to another repository counts for nothing.

A voice can change a severity. The `esbuild` voice makes `entry-no-link-or-credit` a warning, because 8 of the 30 calibration releases break it. `foghorn` and `neutral` keep it hard.

Nine checks warn: `unlabeled-code-block`, `marketing-word`, `entry-too-long` (prose and code together), `too-many-examples` (more than 4 code blocks in one entry), `wall-of-text` (a paragraph over 900 characters), `missing-version-or-date`, `affects-line-missing`, `padding`, `emoji`. The two limits come from 30 calibration releases: the most examples in one entry was 4, and the longest paragraph was 859 characters.

A hedge such as "in theory" is content. The checker never flags one.

## Voices

| Preset | Person | Shape |
|---|---|---|
| `foghorn` (default) | first | The house voice: name the change, old and new output, optional `Affects:` and `To check:` lines when a change can break someone. |
| `esbuild` | first | The preset calibrated on esbuild's own release notes. No `Affects:` line. Full releases still fail hard in places: see AGENTS.md. |
| `neutral` | third | The same shape, with the project as the subject. Credits as "Reported by @x. Fixed by @y." |

Under `esbuild`, 2 of the 30 calibration releases (v0.22.0 to v0.28.2) fail a hard check. Under `foghorn`, 8 of 30 do. The gap is `entry-no-link-or-credit`.

A voice is a JSON file. See `foghorn.voice.example.json` and `schema/foghorn-voice.schema.json`. The ten patterns behind the calibration preset are in `skills/voice/references/patterns.md`, each with a short quote and its source.

## How it differs from `--generate-notes`

`gh release create --generate-notes` is instant, free and deterministic. It lists pull request titles and authors. If your pull request titles are good and your readers only need a list, use it.

foghorn does more and costs more. It reads the diffs and the linked issues. It drops internal noise. It classifies the changes. It asks for a real before and after. It adds a preface to a breaking release. It checks the result with code. It needs a model, it takes minutes, and a person must read the draft before it ships. A model can still misread a diff.

## Limits

- foghorn drafts. A person reviews. `behavior-no-example` looks for a fenced block, or for a code span or a quoted string in the same paragraph as the sentence that says "previously" or "now". It does not know whether the example is true, or whether it belongs to the change.
- The collector can only credit what git and the pull requests record. A fix made in a private chat has no handle.
- `behavior-no-example` is a heuristic. It looks for words such as "previously" and "now". An entry with no code span and no quoted string anywhere is skipped, because nothing could be shown.
- Read-only comes from the permission mode and the allow and deny rules that you run with. It does not come from the agent file: Claude Code does not enforce a command pattern in the `tools` line of an agent, so the collector gets the plain `Bash` tool. Keep Claude Code in the default permission mode when you run `/foghorn:draft`, and keep your own deny rules for `git push` and `gh` writes.
- `gh` runs through `scripts/gh-read.ts`, which takes `pr view`, `pr list`, `issue view`, `release view`, `release list`, `repo view` and `api repos/<owner>/<repo>/...` (GET) and refuses the rest. Any other `gh` form, including `GH_TOKEN=$(gh auth token --user x) gh ...`, matches no allow rule and prompts you.
- Text of pull requests, issues and commits is data. The skill never runs a command, adds a link or credits a handle because that text asks. It shows you every evidence command before it runs one.
- A model cannot run your product. When a before and after needs a command that you did not allow, foghorn asks you to run it. When neither reading nor running gives an example, the entry has none and says so.
- A raw GitHub release body has no version or date in it. The checker warns about that.

## Privacy

foghorn has no server and sends no data of its own. The skills run on your machine through your Claude Code session. They read git history and, through the `gh` command line tool you have signed in to, pull requests and issues. That text goes to the model in your session, as any text in a session does. foghorn writes a scratch file in a per-run directory under the plugin data directory (`~/.claude/plugins/data/`) and the file you name. It never switches your `gh` account.

## Terms

foghorn is provided as is, under the MIT license, with no warranty. You are responsible for the notes you publish.

## License

MIT. See `LICENSE`.

## Credits

The foghorn voice was inspired by the release notes of [esbuild](https://github.com/evanw/esbuild/releases), written by Evan Wallace. foghorn is not affiliated with esbuild and esbuild has not endorsed it. Short quotes carry their source. The icon credit is in [CREDITS.md](CREDITS.md). Other notices are in `THIRD_PARTY_NOTICES.md`.
