# The ten patterns of the esbuild release voice

Each pattern has one short quote from a real esbuild release. The quote and its source were read from the GitHub release text. Short quotes only: read the release for the rest.

## 1. A preface only for breaking releases

A bold line opens a breaking release. Pinning advice follows.

> **This release deliberately contains backwards-incompatible changes.**

Source: https://github.com/evanw/esbuild/releases/tag/v0.27.0

## 2. The title names the thing and the change

The title carries the issue links. A security entry links the advisory id.

> Fix regression with `--define` and `import.meta` ([#4010](https://github.com/evanw/esbuild/issues/4010), [#4012](https://github.com/evanw/esbuild/issues/4012), [#4013](https://github.com/evanw/esbuild/pull/4013))

Source: https://github.com/evanw/esbuild/releases/tag/v0.24.2

> Restrict access to esbuild's development server ([GHSA-67mh-4wv8-2f99](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99))

Source: https://github.com/evanw/esbuild/releases/tag/v0.25.0

## 3. Background, then old behavior, then the new behavior

> Previously esbuild could incorrectly fail to parse certain keywords as TypeScript tuple labels

Source: https://github.com/evanw/esbuild/releases/tag/v0.25.5 (the same entry goes on with "With this release, these keywords will now be parsed correctly.")

## 4. Show, do not describe

Labeled blocks: `Original code`, `Old output`, `New output`, with the flags in the label.

> // Old output (with --bundle --format=esm --platform=node --target=node18,es2022)

Source: https://github.com/evanw/esbuild/releases/tag/v0.23.1

## 5. Say the cause and the version of a regression

> The regression was introduced in version 0.18.7 of esbuild.

Source: https://github.com/evanw/esbuild/releases/tag/v0.23.1

## 6. Name new requirements concretely

A short list with the version numbers.

> * macOS: now requires macOS 12 (Monterey) or later

Source: https://github.com/evanw/esbuild/releases/tag/v0.27.0

## 7. A migration step, not an apology

The exact flag that restores the old behavior.

> If you don't want this behavior, you can do `--packages=bundle` to allow packages to be included in the bundle

Source: https://github.com/evanw/esbuild/releases/tag/v0.22.0

## 8. Credit by handle, in one sentence

> This fix was contributed by [@sapphi-red](https://github.com/sapphi-red).

Source: https://github.com/evanw/esbuild/releases/tag/v0.24.2

> Thanks to [@sapphi-red](https://github.com/sapphi-red) for reporting this issue.

Source: https://github.com/evanw/esbuild/releases/tag/v0.25.0

## 9. Plain honesty

A hedge marks real uncertainty. It is never filler.

> Hopefully this release is uneventful

Source: https://github.com/evanw/esbuild/releases/tag/v0.26.0

## 10. Size follows content

A release with one change has one entry. Version 0.26.0 is one entry of 678 characters. Version 0.24.2 is one entry of 712 characters. No padding.

Sources: https://github.com/evanw/esbuild/releases/tag/v0.26.0 and https://github.com/evanw/esbuild/releases/tag/v0.24.2
