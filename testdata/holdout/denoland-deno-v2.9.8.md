<!-- source: https://github.com/denoland/deno/releases/tag/v2.9.8 (excerpt) -->
### 2.9.8 / 2026.10.21

- fix(compile): check read permission for dynamically imported local files
  (#36925)
- fix(completions): complete script paths for bare deno run in zsh (#36976)
- fix(core): keep op contexts alive until the isolate is disposed (#37026)
- fix(coverage): skip the V8 code cache while collecting coverage (#36901)
- fix(ext/fetch): bump hyper-util to 0.1.21 and hyper to 1.11.1 to cancel idle
  interval when pool empties (#36968)
- fix(ext/napi): check napi_create_dataview bounds for overflow (#36962)
- fix(ext/napi): ignore the callback return value while an exception is pending
  (#36942)
- fix(ext/node): align X.509v1 certificate handling with OpenSSL (#36933)
- fix(ext/node): mock.reset() restores mock.method() implementations (#36886)
- fix(ext/node): support assert message functions and format arguments (#36944)
- fix(npm): validate package link names (#37047)
- fix(tls): distrust compromised eMudhra certificate authorities (#37046)
