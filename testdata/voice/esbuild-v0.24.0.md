<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.24.0 (excerpt) -->
**_This release deliberately contains backwards-incompatible changes._** To avoid automatically picking up releases like this, you should either be pinning the exact version of `esbuild` in your `package.json` file (recommended) or be using a version range syntax that only accepts patch upgrades such as `^0.23.0` or `~0.23.0`. See npm's documentation about [semver](https://docs.npmjs.com/cli/v6/using-npm/semver/) for more information.

* Drop support for older platforms ([#3902](https://github.com/evanw/esbuild/pull/3902))

    This release drops support for the following operating system:

    * macOS 10.15 Catalina

    This is because the Go programming language dropped support for this operating system version in Go 1.23, and this release updates esbuild from Go 1.22 to Go 1.23. Go 1.23 now requires macOS 11 Big Sur or later.

    Note that this only affects the binary esbuild executables that are published to the esbuild npm package. It's still possible to compile esbuild's source code for these older operating systems. If you need to, you can compile esbuild for yourself using an older version of the Go compiler (before Go version 1.23). That might look something like this:

    ```
    git clone https://github.com/evanw/esbuild.git
    cd esbuild
    go build ./cmd/esbuild
    ./esbuild --version
    ```
