<!-- source: https://github.com/astral-sh/ruff/releases/tag/0.17.1 (excerpt) -->
## Release Notes

Released on 2026-10-15.

### Preview features

- \[`pycodestyle`\] Don't treat `None`, `True`, or `False` as keywords (`E271`-`E274`) ([#29322](https://github.com/astral-sh/ruff/pull/29322))

### Bug fixes

- Fix dedent with multiple leading comments ([#29382](https://github.com/astral-sh/ruff/pull/29382))
- \[`flake8-pyi`\] Detect legacy positional-only parameters in `__new__` methods (`PYI063`) ([#28502](https://github.com/astral-sh/ruff/pull/28502))
- \[`flake8-pyi`\] Fix false positives on quoted annotations (`PYI036`) ([#29274](https://github.com/astral-sh/ruff/pull/29274))
- \[`perflint`\] Avoid invalid comprehension suggestions (`PERF401`, `PERF403`) ([#29366](https://github.com/astral-sh/ruff/pull/29366))

### Rule changes

- Treat more `collections` and `weakref` containers as mutable ([#29213](https://github.com/astral-sh/ruff/pull/29213))

### Documentation

- \[`flake8-import-conventions`\] Update default and example `aliases` ([#29333](https://github.com/astral-sh/ruff/pull/29333))

### Contributors

- [@fixfon](https://github.com/fixfon)
- [@mmaxjr](https://github.com/mmaxjr)
- [@joshuavetos](https://github.com/joshuavetos)
- [@nekomario28](https://github.com/nekomario28)
- [@ntBre](https://github.com/ntBre)
- [@shan3520](https://github.com/shan3520)

## Install ruff 0.17.1
