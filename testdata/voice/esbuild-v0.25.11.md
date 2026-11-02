<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.25.11 (excerpt) -->
* Add support for `with { type: 'bytes' }` imports ([#4292](https://github.com/evanw/esbuild/issues/4292))

    The [import bytes](https://github.com/tc39/proposal-import-bytes) proposal has reached stage 2.7 in the TC39 process, which means that although it isn't quite recommended for implementation, it's generally approved and ready for validation. Furthermore it has already been implemented by [Deno](https://docs.deno.com/examples/importing_bytes/) and [Webpack](https://github.com/webpack/webpack/pull/19928). So with this release, esbuild will also add support for this. It behaves exactly the same as esbuild's existing [`binary` loader](https://esbuild.github.io/content-types/#binary). Here's an example:

    ```js
    import data from './image.png' with { type: 'bytes' }
    const view = new DataView(data.buffer, 0, 24)
    const width = view.getInt32(16)
    const height = view.getInt32(20)
    console.log('size:', width + '\xD7' + height)
    ```
