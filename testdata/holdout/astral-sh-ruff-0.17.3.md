<!-- source: https://github.com/astral-sh/ruff/releases/tag/0.17.3 (excerpt) -->
## Release Notes

Released on 2026-10-26.

### Preview features

- \[`suspicious`\] Add `shared-clock-mock` ([#29074](https://github.com/astral-sh/ruff/pull/29074))

### Bug fixes

- \[`pyupgrade`\] Avoid incorrect conversions to f-strings (`UP032`) ([#25485](https://github.com/astral-sh/ruff/pull/25485))

### Performance

- Buffer stdout in `ruff format` ([#29631](https://github.com/astral-sh/ruff/pull/29631))
- Specialize ASCII identifier lexing ([#29503](https://github.com/astral-sh/ruff/pull/29503))
- Speed up identifier and keyword lexing ([#29463](https://github.com/astral-sh/ruff/pull/29463))

### Documentation

- \[`flake8-bandit`\] Describe what the rule actually checks for `httpx` (`S113`) ([#27936](https://github.com/astral-sh/ruff/pull/27936))

### Contributors

- [@itsvedantkumar](https://github.com/itsvedantkumar)
- [@charliermarsh](https://github.com/charliermarsh)
- [@anishgirianish](https://github.com/anishgirianish)

## Install ruff 0.17.3

### Install prebuilt binaries via shell script

```sh
curl --proto '=https' --tlsv1.2 -LsSf https://releases.astral.sh/github/ruff/releases/download/0.17.3/ruff-installer.sh | sh
```

### Install prebuilt binaries via powershell script

```sh
powershell -ExecutionPolicy Bypass -c "irm https://releases.astral.sh/github/ruff/releases/download/0.17.3/ruff-installer.ps1 | iex"
