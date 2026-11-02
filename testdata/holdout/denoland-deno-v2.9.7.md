<!-- source: https://github.com/denoland/deno/releases/tag/v2.9.7 (excerpt) -->
### 2.9.7 / 2026.09.16

- fix(audit): honor configured CA stores (#36728)
- fix(cache): make HTTP authority paths unambiguous (#36356)
- fix(cli): accept all valid sys permission descriptors (#36753)
- fix(cli): don't duplicate passthrough args for deno deploy/sandbox (#36722)
- fix(cli): generate valid bash completions (#36736)
- fix(cli): preserve double dash before the entrypoint (#36835)
- fix(cli): restore optional-value semantics for deno bundle --sourcemap
  (#36723)
- fix(completions): keep the dash on short flags in zsh completions (#36720)
- fix(desktop): complete deferred window close and fix NAPI symbol export on
  Linux (#36718)
- fix(ext/http): extract traceparent from Deno.serve regardless of header name
  case (#36840)
- fix(ext/node): allow repeated child process signals (#36644)
- fix(ext/node): check resolved IP against net deny list in tcp_wrap bind
  (#36482)
- fix(ext/node): don't panic on prime sizes below 2 bits (#36400)
- fix(ext/node): improve node:dns error codes and lookupService/setLocalAddress
  compat (#36552)
- fix(ext/node): normalize resourceUsage maxRSS on macOS (#36784)
- fix(install): validate lockfile tarball registry paths (#36473)
- fix(lsp): resolve the newest prerelease of jsr packages that have no stable
  release (#36655)
- fix(net): check permissions for multicast membership (#36529)
