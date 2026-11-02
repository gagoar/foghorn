<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.25.10 (excerpt) -->
* Fix a panic in a minification edge case ([#4287](https://github.com/evanw/esbuild/issues/4287))

    This release fixes a panic due to a null pointer that could happen when esbuild inlines a doubly-nested identity function and the final result is empty. It was fixed by emitting the value `undefined` in this case, which avoids the panic. This case must be rare since it hasn't come up until now. Here is an example of code that previously triggered the panic (which only happened when minifying):

    ```js
    function identity(x) { return x }
    identity({ y: identity(123) })
    ```
