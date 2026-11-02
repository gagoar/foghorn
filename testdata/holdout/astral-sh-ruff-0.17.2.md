<!-- source: https://github.com/astral-sh/ruff/releases/tag/0.17.2 (excerpt) -->
## Release Notes

Released on 2026-10-22.

### Preview features

- \[`complexity`\] Add `unnecessary-regular-expression-compile` ([#25533](https://github.com/astral-sh/ruff/pull/25533))

### Bug fixes

- Avoid syntax errors for type variables with starred constraints (`UP040`, `UP046`, `UP047`, `RUF053`) ([#28362](https://github.com/astral-sh/ruff/pull/28362))
- \[`pydocstyle`\] Treat backslash-escaped `*args` and `**kwargs` as documented (`D417`) ([#29536](https://github.com/astral-sh/ruff/pull/29536))
- \[`pylint`\] Avoid false positive on starred elements (`PLE0643`) ([#29483](https://github.com/astral-sh/ruff/pull/29483))
- \[`pylint`\] Mark fixes unsafe when deleting comments (`PLR5501`, `PLW0120`) ([#29414](https://github.com/astral-sh/ruff/pull/29414))
- \[`pyupgrade`\] Mark fix unsafe when deleting comments (`UP035`) ([#29413](https://github.com/astral-sh/ruff/pull/29413))

### Performance

- Avoid intermediate names in lint name resolution ([#29506](https://github.com/astral-sh/ruff/pull/29506))
- Prefilter bidirectional Unicode checks by UTF-8 leading bytes ([#29561](https://github.com/astral-sh/ruff/pull/29561))
- Share postfix parsing and reduce expression copies ([#29480](https://github.com/astral-sh/ruff/pull/29480))

### Configuration
