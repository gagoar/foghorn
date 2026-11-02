<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.28.0 (excerpt) -->
* Add support for `with { type: 'text' }` imports ([#4435](https://github.com/evanw/esbuild/issues/4435))

    The [import text](https://github.com/tc39/proposal-import-text) proposal has reached stage 3 in the TC39 process, which means that it's recommended for implementation. It has also already been implemented by [Deno](https://docs.deno.com/examples/importing_text/) and [Bun](https://bun.com/docs/guides/runtime/import-html). So with this release, esbuild also adds support for it. This behaves exactly the same as esbuild's existing [`text` loader](https://esbuild.github.io/content-types/#text). Here's an example:

    ```js
    import string from './example.txt' with { type: 'text' }
    console.log(string)
    ```
