# Security policy

## Supported versions

Only the latest release gets security fixes. Check the version in `.claude-plugin/plugin.json` against the [releases page](https://github.com/gagoar/foghorn/releases).

## Report a vulnerability

Do not open a public issue. Use [private vulnerability reporting](https://github.com/gagoar/foghorn/security/advisories/new) on this repository.

Include the version, the steps to reproduce, and the effect you see. You get a first reply within 7 days.

## Scope

foghorn has no hook, no server and no telemetry. The skills run in your session. The scripts run on your machine and make no network call, except `gh` and `git` read calls that you start yourself. A report is in scope when a script in this repository reads, writes or runs something it should not.
