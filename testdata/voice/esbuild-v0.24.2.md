<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.24.2 (excerpt) -->
* Fix regression with `--define` and `import.meta` ([#4010](https://github.com/evanw/esbuild/issues/4010), [#4012](https://github.com/evanw/esbuild/issues/4012), [#4013](https://github.com/evanw/esbuild/pull/4013))

    The previous change in version 0.24.1 to use a more expression-like parser for `define` values to allow quoted property names introduced a regression that removed the ability to use `--define:import.meta=...`. Even though `import` is normally a keyword that can't be used as an identifier, ES modules special-case the `import.meta` expression to behave like an identifier anyway. This change fixes the regression.

    This fix was contributed by [@sapphi-red](https://github.com/sapphi-red).
