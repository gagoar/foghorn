<!-- source: https://github.com/evanw/esbuild/releases/tag/v0.26.0 (excerpt) -->
* Enable trusted publishing ([#4281](https://github.com/evanw/esbuild/issues/4281))

    GitHub and npm are recommending that maintainers for packages such as esbuild switch to [trusted publishing](https://docs.npmjs.com/trusted-publishers). With this release, a VM on GitHub will now build and publish all of esbuild's packages to npm instead of me. In theory.

    Unfortunately there isn't really a way to test that this works other than to do it live. So this release is that live test. Hopefully this release is uneventful and is exactly the same as the previous one (well, except for the green provenance attestation checkmark on npm that happens with trusted publishing).
