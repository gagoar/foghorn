* Check TypeScript files written through a shell with an advisory Stop hook ([#33](https://github.com/gagoar/typescript-patterns-enforcer/pull/33))

    The mechanical checks ran from a `PostToolUse` hook, and that hook only sees files that the Edit and Write tools wrote. A `.ts` file written by a shell heredoc or a script never reached the checks.

    With this release, the plugin also registers a `Stop` hook. When a session ends, it walks the working directory for `.ts` and `.tsx` files modified since the session began and runs the same checks on them. It skips `node_modules`, `.git`, `dist`, `build`, `out`, `coverage`, `.next`, `.turbo` and `.d.ts` files. It is advisory: it reports through `systemMessage` and always exits 0, so it cannot trap a session.

    New output (a `.ts` file written through a shell, then the session stops):

    ```
    ts-patterns: mechanical violations in TypeScript files changed this session (the edit hook does not see files written through a shell):
    src/list.ts:
      L1:64  no-zero-comparison  `.length` compared with zero: coerce it (`!!x.length`, `!x.length`) (see SKILL.md Core Rule 10).
    ```

* Add six syntactic checks: zero-length comparison, repeated literal, colon-annotated lookup table, fail-open default, `String()` of an optional chain and void-returning guard ([#35](https://github.com/gagoar/typescript-patterns-enforcer/pull/35))

    The hook now flags six more patterns from the audit of the rules. Each check is syntactic only, because the engine has no type information, so each one matches a narrow shape:

    * `no-zero-comparison` flags `.length` compared with zero (`> 0`, `=== 0`, `>= 1`, `< 1` and the loose forms). It matches `.length` only.
    * `repeated-literal` flags the same string or template, at least 8 characters long, written 3 or more times in one file.
    * `colon-annotated-lookup` flags `const x: Record<K, V> = { ... }`. Use `{ ... } as const satisfies Record<K, V>` so that `keyof typeof x` keeps the literal keys. The check ignores an empty `{}`.
    * `fail-open-default` flags `call() ?? ""` and `call() ?? 0`. The check ignores a property default such as `error.status ?? 0`, an arithmetic operand and a template placeholder.
    * `string-of-optional-chain` flags `String(a?.b)`, because `String(undefined)` is `"undefined"`.
    * `void-guard` flags a function named `guard` or `assert*` that returns `void`. Declare `asserts condition` so that the narrowing reaches the caller.

    Original code:

    ```ts
    export function guard(condition: boolean, message: string): void {
      if (!condition) throw new Error(message);
    }
    ```

    Old output: none. The hook exited with code 0.

    New output:

    ```
    ts-patterns: 1 mechanical violation(s) in guard.ts:
      L1:8  void-guard  `guard` returns void: declare `asserts condition` so the narrowing reaches the caller (see SKILL.md Core Rule 1).  → SKILL.md Core Rule 1 — declare `asserts condition`
    ```

    The other five checks follow the same pattern.

    Affects: anyone who runs the plugin on an existing TypeScript codebase. The `PostToolUse` hook exits with code 2 when it finds a violation. An edit to a file that already contains one of these patterns now goes back to Claude for a fix.

    To check: pipe a hook payload to the engine, as in `echo '{"tool_input":{"file_path":"src/a.ts"}}' | node "${CLAUDE_PLUGIN_ROOT}/engine/dist/check.js"`.

* Stop the magic-number check from flagging numbers inside a named constant ([#35](https://github.com/gagoar/typescript-patterns-enforcer/pull/35))

    Previously the check flagged every number in an arithmetic expression, even when the expression is the initial value of a `const` that names the result. The check also flagged a number inside an `as const` table, although the table is the named constant.

    With this release, the check skips a number in the arithmetic of a `const` initializer and a number inside an `as const` literal. This is a deliberate difference from typescript-eslint, which exempts only a bare initializer.

    Original code:

    ```ts
    export const MAX_BYTES = 16 * 1024 * 1024;
    ```

    Old output:

    ```
    ts-patterns: 3 mechanical violation(s) in magic.ts:
      L1:26  no-magic-numbers  No magic number: 16.  → SKILL.md Core Rule 9 — extract to a named const
      L1:31  no-magic-numbers  No magic number: 1024.  → SKILL.md Core Rule 9 — extract to a named const
      L1:38  no-magic-numbers  No magic number: 1024.  → SKILL.md Core Rule 9 — extract to a named const
    ```

    New output: none. The hook exits with code 0.

* Fold the audit findings into the check skill and the review agent ([#32](https://github.com/gagoar/typescript-patterns-enforcer/pull/32))

    The `check` skill and the `review` agent gain the rules that the audit found. No mechanical check covers them. They are: hand-written library shapes, illegal states, fail-open defaults, cast laundering, repeated literals, string boundaries and small items. The review agent has new checklist items 18 to 24.

    Each finding now carries the label `correctness` or `style`. A change is done when no `correctness` finding remains. The skill's review checklist now asks you to print each item marked `checked` or `n/a`. It also covers files written through a shell.
