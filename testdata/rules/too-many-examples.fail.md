<!-- test fixture: synthetic text for the checker, not a real release -->
## v1.2.3 (2025-01-01)

* Fix the parser ([#12](https://example.invalid/acme/tool/issues/12))

    Previously the parser dropped a line. With this release it keeps the line.

    ```
    // Old output 0
    x
    ```

    ```
    // Old output 1
    x
    ```

    ```
    // Old output 2
    x
    ```

    ```
    // Old output 3
    x
    ```

    ```
    // Old output 4
    x
    ```
