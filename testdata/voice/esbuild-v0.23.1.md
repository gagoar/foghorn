<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.23.1 (excerpt) -->
* Allow using the `node:` import prefix with `es*` targets ([#3821](https://github.com/evanw/esbuild/issues/3821))

    The [`node:` prefix on imports](https://nodejs.org/api/esm.html#node-imports) is an alternate way to import built-in node modules. For example, `import fs from "fs"` can also be written `import fs from "node:fs"`. This only works with certain newer versions of node, so esbuild removes it when you target older versions of node such as with `--target=node14` so that your code still works. With the way esbuild's platform-specific feature compatibility table works, this was added by saying that only newer versions of node support this feature. However, that means that a target such as `--target=node18,es2022` removes the `node:` prefix because none of the `es*` targets are known to support this feature. This release adds the support for the `node:` flag to esbuild's internal compatibility table for `es*` to allow you to use compound targets like this:

    ```js
    // Original code
    import fs from 'node:fs'
    fs.open

    // Old output (with --bundle --format=esm --platform=node --target=node18,es2022)
    import fs from "fs";
    fs.open;

    // New output (with --bundle --format=esm --platform=node --target=node18,es2022)
    import fs from "node:fs";
    fs.open;
    ```
