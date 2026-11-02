<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.25.5 (excerpt) -->
* Fix a regression with `browser` in `package.json` ([#4187](https://github.com/evanw/esbuild/issues/4187))

    The fix to [#4144](https://github.com/evanw/esbuild/issues/4144) in version 0.25.3 introduced a regression that caused `browser` overrides specified in `package.json` to fail to override relative path names that end in a trailing slash. That behavior change affected the `axios@0.30.0` package. This regression has been fixed, and now has test coverage.

* Add support for certain keywords as TypeScript tuple labels ([#4192](https://github.com/evanw/esbuild/issues/4192))

    Previously esbuild could incorrectly fail to parse certain keywords as TypeScript tuple labels that are parsed by the official TypeScript compiler if they were followed by a `?` modifier. These labels included `function`, `import`, `infer`, `new`, `readonly`, and `typeof`. With this release, these keywords will now be parsed correctly. Here's an example of some affected code:

    ```ts
    type Foo = [
      value: any,
      readonly?: boolean, // This is now parsed correctly
    ]
    ```
