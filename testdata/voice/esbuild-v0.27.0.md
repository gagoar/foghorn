<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.27.0 (excerpt) -->
**This release deliberately contains backwards-incompatible changes.** To avoid automatically picking up releases like this, you should either be pinning the exact version of `esbuild` in your `package.json` file (recommended) or be using a version range syntax that only accepts patch upgrades such as `^0.26.0` or `~0.26.0`. See npm's documentation about [semver](https://docs.npmjs.com/cli/v6/using-npm/semver/) for more information.

* Use `Uint8Array.fromBase64` if available ([#4286](https://github.com/evanw/esbuild/issues/4286))

    With this release, esbuild's `binary` loader will now use the new [`Uint8Array.fromBase64`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64) function unless it's unavailable in the configured target environment. If it's unavailable, esbuild's previous code for this will be used as a fallback. Note that this means you may now need to specify `target` when using this feature with Node (for example `--target=node22`) unless you're using Node v25+.

* Update the Go compiler from v1.23.12 to v1.25.4 ([#4208](https://github.com/evanw/esbuild/issues/4208), [#4311](https://github.com/evanw/esbuild/pull/4311))

    This raises the operating system requirements for running esbuild:

    * Linux: now requires a kernel version of 3.2 or later
    * macOS: now requires macOS 12 (Monterey) or later
