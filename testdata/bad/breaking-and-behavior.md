<!-- test fixture: a deliberately bad draft, synthetic -->
## v0.9.0 (2025-04-01)

* Rename the `output` option ([#50](https://example.invalid/acme/tool/issues/50))

    Previously the option was called `output`. It is now called `outfile`. This is a backwards-incompatible change.

* Fix source maps for `--minify` ([#51](https://example.invalid/acme/tool/issues/51))

    Source maps no longer point at the wrong line.
