# Regex testers

Every regex in the code has a comment with an example. This page holds the tester link for each one,
so that the code carries no link: the directory scan holds a plugin for review when a code file has a remote URL.
A test checks that each regex has a row here. The text in each link is the first quoted example of the comment above the regex.
`scripts/check-plugin-safety.ts` is the canonical gate shared with other plugins and is not listed.

| File | Name | Tester |
|---|---|---|
| `scripts/gh-read.ts` | `LOGIN` | [open](https://regexr.com/?expression=%2F%5E%5BA-Za-z0-9%5D%5BA-Za-z0-9_-%5D%7B0%2C38%7D%24%2F&text=gagoar) |
| `scripts/gh-read.ts` | `SHELL_SYNTAX` | [open](https://regexr.com/?expression=%2F%5B%3B%7C%26%60%24%3C%3E%5C%5C%28%29%7B%7D%5Cn%5Cr%5D%2F&text=%3B) |
| `scripts/gh-read.ts` | `NUMBER` | [open](https://regexr.com/?expression=%2F%5E%5Cd%7B1%2C9%7D%24%2F&text=123) |
| `scripts/gh-read.ts` | `REPOSITORY` | [open](https://regexr.com/?expression=%2F%5E%5B%5Cw.-%5D%2B%5C%2F%5B%5Cw.-%5D%2B%24%2F&text=evanw%2Fesbuild) |
| `scripts/gh-read.ts` | `TAG` | [open](https://regexr.com/?expression=%2F%5E%5B%5Cw%5D%5B%5Cw.%40%2F%2B-%5D%7B0%2C99%7D%24%2F&text=v1.2.3) |
| `scripts/gh-read.ts` | `FIELDS` | [open](https://regexr.com/?expression=%2F%5E%5BA-Za-z%5D%2B%28%3F%3A%2C%5BA-Za-z%5D%2B%29%2A%24%2F&text=title%2Cbody%2Cauthor) |
| `scripts/gh-read.ts` | `SEARCH` | [open](https://regexr.com/?expression=%2F%5E%5B%5Cw%20.%3A%40%2F%23%3D%3C%3E%2B-%5D%7B1%2C200%7D%24%2F&text=abc123%20is%3Amerged) |
| `scripts/gh-read.ts` | `NAME` | [open](https://regexr.com/?expression=%2F%5E%5B%5Cw%5D%5B%5Cw.%2F%20-%5D%7B0%2C99%7D%24%2F&text=main) |
| `scripts/gh-read.ts` | `STATE` | [open](https://regexr.com/?expression=%2F%5E%28%3F%3Aopen%7Cclosed%7Cmerged%7Call%29%24%2F&text=merged) |
| `scripts/gh-read.ts` | `LIMIT` | [open](https://regexr.com/?expression=%2F%5E%5Cd%7B1%2C4%7D%24%2F&text=50) |
| `scripts/gh-read.ts` | `METHOD` | [open](https://regexr.com/?expression=%2F%5EGET%24%2F&text=GET) |
| `scripts/gh-read.ts` | `API_PATH` | [open](https://regexr.com/?expression=%2F%5E%28%3F%21.%2A%5C.%5C.%29repos%5C%2F%5B%5Cw.-%5D%2B%5C%2F%5B%5Cw.-%5D%2B%5C%2F%5B%5Cw.%2F%3F%3D%26%2C%25%3A%2B-%5D%2A%24%2F&text=repos%2Fa%2Fb%2Freleases%3Fper_page%3D5) |
| `scripts/gh-read.ts` | `JOINED` | [open](https://regexr.com/?expression=%2F%5E%28--%5Ba-z-%5D%2B%29%3D%28%5B%5Cs%5CS%5D%2A%29%24%2F&text=--json%3Da%2Cb) |
| `scripts/gh-read.ts` | `FLAG` | [open](https://regexr.com/?expression=%2F%5E-%2F&text=--json) |
| `scripts/notes-checks.ts` | `BREAKING` | [open](https://regexr.com/?expression=%2F%5Cb%28%3F%3Abackwards%3F%5B-%20%5Dincompatible%7Cbreaking%5B-%20%5Dchanges%3F%7Cincompatible%20changes%3F%7Cbreaking%20release%29%5Cb%7C%5Cbbreaking%3A%2Fi&text=backwards-incompatible%20changes) |
| `scripts/notes-checks.ts` | `NEGATED_BREAKING` | [open](https://regexr.com/?expression=%2F%5Cb%28%3F%3Anot%7Cno%7Cnon%7Cwithout%29%5Cb%5B%5E.%2C%3B%3A%21%3F%5Cn%5D%7B0%2C40%7D%5Cb%28%3F%3Abreaking%7Cbackwards%3F%5B-%20%5Dincompatible%7Cincompatible%29%5Cb%2Fgi&text=is%20not%20one%20of%20the%20breaking%20change%20releases) |
| `scripts/notes-checks.ts` | `BREAKING_TOOL` | [open](https://regexr.com/?expression=%2F%5Cbbreaking%5B-%20%5Dchanges%3F%5Cs%2B%28%3F%3Adetection%7Cdetector%7Cchecks%3F%7Cchecker%7Clabels%3F%7Cpolicy%7Cworkflow%7Ctests%3F%7Clinter%7Crules%3F%7Cwarnings%3F%7Cdocs%7Cdocumentation%7Cscript%29%5Cb%2Fgi&text=Fix%20breaking%20change%20detection%20in%20x) |
| `scripts/notes-checks.ts` | `BEHAVIOR` | [open](https://regexr.com/?expression=%2F%5Cb%28%3F%3Apreviously%7Cno%20longer%7Cinstead%20of%7Cused%20to%7Cnow%29%5Cb%2Fi&text=Old%20behavior%3A%20esbuild%20no%20longer) |
| `scripts/notes-checks.ts` | `INLINE_CODE` | [open](https://regexr.com/?expression=%2F%60%5B%5E%60%5Cn%5D%2B%60%2F&text=use%20%60--minify%60) |
| `scripts/notes-checks.ts` | `CODE_SPANS` | [open](https://regexr.com/?expression=%2F%60%5B%5E%60%5Cn%5D%2A%60%2Fg&text=use%20%60--minify%60%20now) |
| `scripts/notes-checks.ts` | `QUOTED` | [open](https://regexr.com/?expression=%2F%5B%22%E2%80%9C%5D%5B%5E%22%E2%80%9D%5Cn%5D%2B%5B%22%E2%80%9D%5D%2F&text=ok) |
| `scripts/notes-checks.ts` | `TRACE_REF` | [open](https://regexr.com/?expression=%2F%5B%28%5B%5D%5Cs%2A%23%5Cd%2B%5Cb%7C%5C%5D%5C%28%5B%5E%29%5Cs%5D%7B1%2C300%7D%5C%29%5Cs%2B%23%5Cd%2B%5Cb%2F&text=%28%234281%29) |
| `scripts/notes-checks.ts` | `TRACE_LINK` | [open](https://regexr.com/?expression=%2Fhttps%3F%3A%5C%2F%5C%2Fgithub%5C.com%5C%2F%5B%5Cw.-%5D%2B%5C%2F%5B%5Cw.-%5D%2B%5C%2F%28%3F%3A%28%3F%3Apull%7Cissues%29%5C%2F%5Cd%2B%7Ccommit%5C%2F%5B0-9a-f%5D%7B7%2C40%7D%29%5Cb%2Fi&text=https%3A%2F%2Fgithub.com%2Fa%2Fb%2Fpull%2F5) |
| `scripts/notes-checks.ts` | `TRACE_ID` | [open](https://regexr.com/?expression=%2F%5CbGHSA%28%3F%3A-%5Ba-z0-9%5D%7B4%7D%29%7B3%7D%5Cb%7C%5CbCVE-%5Cd%7B4%7D-%5Cd%7B4%2C%7D%5Cb%2Fi&text=GHSA-x2m9-q6w4-mm5r) |
| `scripts/notes-checks.ts` | `MARKDOWN_LINK` | [open](https://regexr.com/?expression=%2F%5C%5B%5B%5E%5C%5D%5Cn%5D%7B0%2C200%7D%5C%5D%5C%28%5B%5E%29%5Cs%5D%7B0%2C500%7D%5C%29%2Fg&text=%5B%234281%5D%28x%29) |
| `scripts/notes-checks.ts` | `CREDIT` | [open](https://regexr.com/?expression=%2F%5Cb%28%3F%3Athanks%20to%7Ccontributed%20by%7Csubmitted%20by%7Creported%20by%7Cfixed%20by%7Cauthored%20by%29%5Cs%2B%5C%5B%3F%40%5B%5Cw-%5D%2B%2Fi&text=Thanks%20to%20%40evanw) |
| `scripts/notes-checks.ts` | `NEGATED_CREDIT` | [open](https://regexr.com/?expression=%2F%28%3F%3A%5Cb%28%3F%3Anot%7Cnever%7Cno%7Cwithout%29%5Cb%7C%5Cb%5Cw%2Bn%5B%27%E2%80%99%5Dt%5Cb%29%5B%5E.%2C%3B%3A%21%3F%5Cn%5D%7B0%2C30%7D%5Cb%28%3F%3Athanks%20to%7Ccontributed%20by%7Csubmitted%20by%7Creported%20by%7Cfixed%20by%7Cauthored%20by%29%5Cs%2B%5C%5B%3F%40%5B%5Cw-%5D%2B%2Fgi&text=Not%20fixed%20by%20%40bob) |
| `scripts/notes-checks.ts` | `CREDIT_SENTENCE` | [open](https://regexr.com/?expression=%2F%5Cb%28%3F%3Athanks%20to%7Ccontributed%20by%7Csubmitted%20by%7Creported%20by%7Cfixed%20by%7Cauthored%20by%29%5Cb%28%3F%3A%5B%5E.%5Cn%5D%7C%5C.%28%3F%21%5Cs%7C%24%29%29%7B0%2C400%7D%2Fgi&text=Thanks%20to%20%40a%20and%20%40b) |
| `scripts/notes-checks.ts` | `HANDLE` | [open](https://regexr.com/?expression=%2F%28%3F%3C%21%5B%5Cw%40%2F%5D%29%40%28%5B%5Cw-%5D%2B%29%28%3F%21%5B%5Cw%2F%40-%5D%29%2Fg&text=%40alice) |
| `scripts/notes-checks.ts` | `EMOJI` | [open](https://regexr.com/?expression=%2F%5Cp%7BEmoji_Presentation%7D%7C%5Cp%7BExtended_Pictographic%7D%5CuFE0F%7C%5B%5Cu%7B1F300%7D-%5Cu%7B1FAFF%7D%5D%2Fu&text=%F0%9F%8E%89) |
| `scripts/notes-checks.ts` | `AFFECTS` | [open](https://regexr.com/?expression=%2F%5E%5Cs%2A%28%3F%3A%5C%2A%5C%2A%29%3FAffects%3A%2Fm&text=Affects%3A%20Node%2012%20users) |
| `scripts/notes-checks.ts` | `RISK` | [open](https://regexr.com/?expression=%2F%5Cb%28%3F%3Abreaking%7Cbackwards%3F%5B-%20%5Dincompatible%7Cincompatible%20changes%3F%7Cno%20longer%7Cnow%20requires%3F%7Craises%20the%20.%7B0%2C30%7Drequirements%3F%29%5Cb%2Fi&text=now%20requires) |
| `scripts/notes-checks.ts` | `PADDING` | [open](https://regexr.com/?expression=%2F%5Cbwe%28%3F%3A%5B%27%E2%80%99%5Dre%7C%20are%29%20%28%3F%3Aso%20%7Cvery%20%29%3F%28%3F%3Aexcited%7Cthrilled%7Chappy%7Cpleased%7Cdelighted%7Cproud%29%7C%5Cb%28%3F%3Apleased%7Cexcited%7Cthrilled%7Cdelighted%29%20to%20%28%3F%3Aannounce%7Cshare%7Cintroduce%29%7C%5Cbwelcome%20to%5Cb%7C%5Cbthis%20release%20brings%5Cb%7C%5Cbpacked%20with%5Cb%2Fgi&text=We%27re%20excited%20to%20announce) |
| `scripts/notes-checks.ts` | `VERSION` | [open](https://regexr.com/?expression=%2F%5Cbv%3F%5Cd%2B%5C.%5Cd%2B%5C.%5Cd%2B%5Cb%2F&text=v0.27.0) |
| `scripts/notes-checks.ts` | `DATE` | [open](https://regexr.com/?expression=%2F%5Cb%5Cd%7B4%7D%5B-.%2F%5D%5Cd%7B2%7D%5B-.%2F%5D%5Cd%7B2%7D%5Cb%2F&text=2025-11-09) |
| `scripts/notes-checks.ts` | `REGEX_SPECIAL` | [open](https://regexr.com/?expression=%2F%5B.%2A%2B%3F%5E%24%7B%7D%28%29%7C%5B%5C%5D%5C%5C%5D%2Fg&text=a.b) |
| `scripts/notes-checks.ts` | `PARAGRAPH_BREAK` | [open](https://regexr.com/?expression=%2F%5Cn%5Cs%2A%5Cn%2F&text=a%0A%0Ab) |
| `scripts/notes-checks.ts` | `COMMENT_LABEL` | [open](https://regexr.com/?expression=%2F%5E%28%3F%3A%5C%2F%5C%2F%7C%23%7C%5C%2F%5C%2A%7C--%29%5Cs%2A%5CS%2F&text=%2F%2F%20Original%20code) |
| `scripts/notes-checks.ts` | `REPO_NAME` | [open](https://regexr.com/?expression=%2F%5E%5B%5Cw.-%5D%2B%5C%2F%5B%5Cw.-%5D%2B%24%2F&text=evanw%2Fesbuild) |
| `scripts/notes-checks.ts` | `AT_SIGN` | [open](https://regexr.com/?expression=%2F%5E%40%2F&text=%40alice) |
| `scripts/notes-cli.ts` | `HANDLE_NAME` | [open](https://regexr.com/?expression=%2F%5E%5B%5Cw-%5D%2B%24%2F&text=alice) |
| `scripts/notes-cli.ts` | `FLAG` | [open](https://regexr.com/?expression=%2F%5E-%2F&text=--json) |
| `scripts/notes-parse.ts` | `HTML_COMMENT` | [open](https://regexr.com/?expression=%2F%3C%21--%5B%5Cs%5CS%5D%2A%3F--%3E%2Fg&text=%3C%21--%20source%20--%3E) |
| `scripts/notes-parse.ts` | `OPENER` | [open](https://regexr.com/?expression=%2F%5E%5Cs%2A%28%60%7B3%2C%7D%7C~%7B3%2C%7D%29%28.%2A%29%24%2F&text=%20%20%20%20%60%60%60ts) |
| `scripts/notes-parse.ts` | `CLOSER` | [open](https://regexr.com/?expression=%2F%5E%5Cs%2A%28%60%7B3%2C%7D%7C~%7B3%2C%7D%29%5Cs%2A%24%2F&text=%60%60%60) |
| `scripts/notes-parse.ts` | `INFO_LANG` | [open](https://regexr.com/?expression=%2F%5E%5Cs%2A%28%5B%5Cw%2B-%5D%2A%29%2F&text=ts%20title%3Dx) |
| `scripts/notes-parse.ts` | `BULLET` | [open](https://regexr.com/?expression=%2F%5E%5B%2A-%5D%5Cs%2B%5CS%2F&text=%2A%20Fix%20a%20bug) |
| `scripts/notes-parse.ts` | `HEADING` | [open](https://regexr.com/?expression=%2F%5E%28%23%7B1%2C6%7D%29%5Cs%2B%5CS%2F&text=%23%23%20v1.2.3%20%282025-01-01%29) |
| `scripts/notes-parse.ts` | `ENTRY_MARKER` | [open](https://regexr.com/?expression=%2F%5E%28%3F%3A%5B%2A-%5D%7C%23%7B1%2C6%7D%29%5Cs%2B%2F&text=%2A%20Fix%20a%20bug) |
| `scripts/notes-parse.ts` | `HANDLE` | [open](https://regexr.com/?expression=%2F%5C%5B%3F%40%5B%5Cw-%5D%2B%5C%5D%3F%28%3F%3A%5C%28%5B%5E%29%5Cn%5D%7B0%2C300%7D%5C%29%29%3F%2Fg&text=%5B%40alice%5D%28x%29) |
| `scripts/notes-parse.ts` | `JOINERS` | [open](https://regexr.com/?expression=%2F%5Cb%28%3F%3Aand%7Cwith%7Cthanks%7Cto%7Cby%29%5Cb%7C%5B%2C%26%3A%3B.%5Cs-%5D%2Fgi&text=thanks%20to%20and) |
| `scripts/notes-parse.ts` | `CREDITS_HEADING` | [open](https://regexr.com/?expression=%2F%5E%28%3F%3Anew%20%29%3F%28%3F%3Acontributors%3F%7Ccredits%3F%7Cthanks%7Cacknowledg%28%3F%3Ae%29%3Fments%3F%29%5Cb%2Fi&text=Contributors) |
| `scripts/notes-parse.ts` | `LINE_BREAK` | [open](https://regexr.com/?expression=%2F%5Cr%3F%5Cn%2F&text=a%0D%0Ab) |
| `test/audit.test.ts` | `HOLDOUT_SOURCE` | [open](https://regexr.com/?expression=%2F%5E%3C%21--%20source%3A%20https%3A%5C%2F%5C%2Fgithub%5C.com%5C%2F%5B%5Cw.-%5D%2B%5C%2F%5B%5Cw.-%5D%2B%5C%2Freleases%5C%2Ftag%5C%2F%5CS%2B%20%5C%28excerpt%5C%29%20--%3E%5Cn%2F&text=%3C%21--%20source%3A%20https%3A%2F%2Fgithub.com%2Fvitejs%2Fvite%2Freleases%2Ftag%2Fv8.3.5%20%28excerpt%29%20--%3E) |
| `test/notes.test.ts` | `FIXTURE_SUFFIX` | [open](https://regexr.com/?expression=%2F%5C.%28%3F%3Apass%7Cfail%29%5C.md%24%2F&text=emoji.pass.md) |
| `test/notes.test.ts` | `SOURCE_COMMENT` | [open](https://regexr.com/?expression=%2F%5E%3C%21--%20source%3A%20https%3A%5C%2F%5C%2Fgithub%5C.com%5C%2Fevanw%5C%2Fesbuild%5C%2Freleases%5C%2Ftag%5C%2Fv%5B%5Cd.%5D%2B%20%5C%28excerpt%5C%29%20--%3E%5Cn%2F&text=%3C%21--%20source%3A%20https%3A%2F%2Fgithub.com%2Fevanw%2Fesbuild%2Freleases%2Ftag%2Fv0.1.0%20%28excerpt%29%20--%3E) |
| `test/repo.test.ts` | `FRONTMATTER` | [open](https://regexr.com/?expression=%2F%5E---%5Cn%28%5B%5Cs%5CS%5D%2A%3F%29%5Cn---%2F&text=example) |
| `test/repo.test.ts` | `KEY` | [open](https://regexr.com/?expression=%2F%5E%28%5Ba-z-%5D%2B%29%3A%2Fgm&text=name%3A%20draft) |
| `test/repo.test.ts` | `TESTER_HOST` | [open](https://regexr.com/?expression=%2Fregex%28%3F%3A%5Cd%2B%7Cr%29%5C.com%2F&text=example) |
| `test/repo.test.ts` | `CODE_FILE` | [open](https://regexr.com/?expression=%2F%5E%28%3F%3Ascripts%7Ctest%29%5C%2F.%2A%5C.ts%24%2F&text=example) |
| `test/repo.test.ts` | `REGEX_DECLARATION` | [open](https://regexr.com/?expression=%2F%5E%28%3F%3Aexport%20%29%3Fconst%20%28%5Cw%2B%29%28%3F%3A%3A%20RegExp%29%3F%20%3D%20%5C%2F%2Fgm&text=const%20SEMVER%20%3D%20%2F%5Ea%24%2F%3B) |
| `test/repo.test.ts` | `REGEX_ROW` | [open](https://regexr.com/?expression=%2F%5E%5C%7C%20%60%28%5B%5E%60%5D%2B%29%60%20%5C%7C%20%60%28%5B%5E%60%5D%2B%29%60%20%5C%7C%2Fgm&text=%7C%20%60scripts%2Fx.ts%60%20%7C%20%60SEMVER%60%20%7C) |
| `test/repo.test.ts` | `QUOTE_MARKER` | [open](https://regexr.com/?expression=%2F%5E%3E%20%3F%2F&text=%3E%20text) |
