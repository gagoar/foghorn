<img src=".claude-plugin/icon.png" alt="foghorn icon" width="120" align="right">

# foghorn

**Release notes that the people affected want to read: technical, honest, and checked by code.**

foghorn is a Claude Code plugin. It drafts release notes for a tag range in the voice of esbuild's releases. It has a checker that fails notes that skip the facts a reader needs.

[Docs](https://gagoar.github.io/foghorn/): a real run, the voice, and the guide.

## Before and after

| Before: a line of a real generated note | After: an entry in the foghorn voice |
|---|---|
| `* trim only ascii whitespace for branch by @aiqiaoy in https://github.com/actions/checkout/pull/2521` | See the entry below. |

Before is one line from the release text of actions/checkout v7.0.1, made by `--generate-notes`. It says what a pull request was called. It does not say what changed for you.

After is a real entry from esbuild v0.24.2, the voice that foghorn follows. The checker passes it with the `esbuild` voice (no hard failure):

> * Fix regression with `--define` and `import.meta` ([#4010](https://github.com/evanw/esbuild/issues/4010), [#4012](https://github.com/evanw/esbuild/issues/4012), [#4013](https://github.com/evanw/esbuild/pull/4013))
>
>     The previous change in version 0.24.1 to use a more expression-like parser for `define` values to allow quoted property names introduced a regression that removed the ability to use `--define:import.meta=...`. Even though `import` is normally a keyword that can't be used as an identifier, ES modules special-case the `import.meta` expression to behave like an identifier anyway. This change fixes the regression.
>
>     This fix was contributed by [@sapphi-red](https://github.com/sapphi-red).

These are two different changes. The table shows the shape of a note, not a rewrite of one change. foghorn does not rewrite old notes. A test checks that the After text is the text of `testdata/voice/esbuild-v0.24.2.md`.

## Install

```
/plugin marketplace add gagoar/foghorn
/plugin install foghorn@foghorn
```

foghorn needs two other plugins for the prose step: `unmistakable` (the `asd-ste100` skill) and `iceberg` (`iceberg:edit`). Both come from the `gago-plugins` marketplace:

```
/plugin marketplace add gagoar/gago-plugins
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
node scripts/check-notes.ts --voice esbuild-plus RELEASE.md
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

A voice can change a severity. The `esbuild` voice makes `entry-no-link-or-credit` a warning, because 8 of the last 30 esbuild releases break it themselves. `esbuild-plus` and `neutral` keep it hard.

Nine checks warn: `unlabeled-code-block`, `marketing-word`, `entry-too-long` (prose and code together), `too-many-examples` (more than 4 code blocks in one entry), `wall-of-text` (a paragraph over 900 characters), `missing-version-or-date`, `affects-line-missing`, `padding`, `emoji`. The two limits come from the 30 latest esbuild releases: the most examples in one entry was 4, and the longest paragraph was 859 characters.

A hedge such as "in theory" is content. The checker never flags one.

## Voices

| Preset | Person | Shape |
|---|---|---|
| `esbuild-plus` (default) | first | The esbuild shape, plus optional `Affects:` and `To check:` lines when a change can break someone. |
| `esbuild` | first | The esbuild shape, as far as the ten hand-cut excerpts in `testdata/voice/` go. No `Affects:` line. Full releases still fail hard in places: see AGENTS.md. |
| `neutral` | third | The same shape, with the project as the subject. Credits as "Reported by @x. Fixed by @y." |

A voice is a JSON file. See `foghorn.voice.example.json` and `schema/foghorn-voice.schema.json`. The ten patterns behind the presets are in `skills/voice/references/patterns.md`, each with a short quote and its source.

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

The voice follows the release notes of [esbuild](https://github.com/evanw/esbuild/releases) by Evan Wallace. Short quotes carry their source. The icon credit is in [CREDITS.md](CREDITS.md). Other notices are in `THIRD_PARTY_NOTICES.md`.
