<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.25.9 (excerpt) -->
* Better support building projects that use Yarn on Windows ([#3131](https://github.com/evanw/esbuild/issues/3131), [#3663](https://github.com/evanw/esbuild/issues/3663))

    With this release, you can now use esbuild to bundle projects that use Yarn Plug'n'Play on Windows on drives other than the `C:` drive. The problem was as follows:

    1. Yarn in Plug'n'Play mode on Windows stores its global module cache on the `C:` drive
    2. Some developers put their projects on the `D:` drive
    3. Yarn generates relative paths that use `../..` to get from the project directory to the cache directory
    4. Windows-style paths don't support directory traversal between drives via `..` (so `D:\..` is just `D:`)
    5. I didn't have access to a Windows machine for testing this edge case

    Yarn works around this edge case by pretending Windows-style paths beginning with `C:\` are actually Unix-style paths beginning with `/C:/`, so the `../..` path segments are able to navigate across drives inside Yarn's implementation. This was broken for a long time in esbuild but I finally got access to a Windows machine and was able to debug and fix this edge case. So you should now be able to bundle these projects with esbuild.
