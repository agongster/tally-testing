# Prompt log

Important, non-trivial prompts, verbatim, with the model and tool used.

**Tool / model:** Claude Code (VS Code extension), Claude Opus 5.5 (`claude-opus-5-5`), unless noted otherwise.

---

## 1. Set up the prompt log

**Prompt:**

> have a prompt_log.md in this folder including prompts from this prompt forward.

**What the AI did:** Created this file in `tally-testing/`. Later prompts will be added below.

## 2. Extract the logic module

**Prompt:**

> the three functions i want to test are money(value), readError(payload, status), and updateSplitSummary. please put these in an extracted logic module.

**What the AI did:** Created `logic.js`, exporting `money`, `readError` and `splitSummary`. `money` and `readError` were moved unchanged. The math in `updateSplitSummary` became the pure `splitSummary({ amount, splitType, exactShares, participantCount })`, which returns `{ text, mismatch }`. `updateSplitSummary` stays in `app.js` and only reads the form and writes the result. `app.js` imports from `./logic.js`, the script tag is now `type="module"`, and `package.json` contains `{ "type": "module" }`. No bugs were fixed. The suspicious behaviour it noticed was reported to the user instead.

## 3. Organize TESTING.md

**Prompt:**

> can you organize TESTING.md so i can fill in the necessary tables and make the different requirements into different sections?

**What the AI did:** Reorganized TESTING.md into a section per requirement, with empty tables for the break-it-on-purpose rows, the fake tests and the CI links. The user's own sentences were kept word for word. The AI wrote no new prose.

## 4. Click-test the refactored page

**Prompt:**

> please do not fix anything or modify the code for this instruction. now open the actual page and test all the functionalities there to see if anything breaks or if all looks right.

**What the AI did:** Served the folder at `localhost:8080` and drove it with headless Chrome through Playwright. The Playwright scripts were kept outside the repo. On localhost the page calls `127.0.0.1:8000`, so those requests were forwarded to the live Render backend instead of changing the code. It tested every button and form:
- sign-in and register tabs, wrong password, duplicate email, forgot password
- demo account, night mode, and creating and deleting groups
- adding and removing members
- the even and exact split previews, and adding expenses of both kinds
- debts, balances, the settle-up modal (Escape and Cancel), recording and undoing a payment, and deleting an expense

Everything worked after the module refactor. The only failure was the AI's own test expecting member removal to succeed while that member still owed money. The server refuses that by design. No code was changed.

## 5. Imports for the hand-written first test

**Prompt:**

> can you include all necessary imports in money.test.js? using the node test, here's an example:
> import { test } from "node:test";
> import assert from "node:assert/strict";
> import { letterGrade } from "../scoring.js";
>
> and verify the syntax?

**What the AI did:** Added the three import lines (`test`, `assert`, and `money` from `../logic.js`) to the top of `tests/money.test.js`. The test itself was written by hand by the user and was not touched. It checked the syntax with `node --check` and ran `node --test`: 1 test, 1 pass.

## 6. Build out the suite

**Prompt:**

> fill in the test suite for money, readError, and splitSummary in the same format as money.test.js. that is, fill in the rest of the money tests using the specifications, and fill in readError and splitSummary in the same way. please be clear and concise with your tests, and make it clear at each point what exactly you are testing. these tests should be comprehensive as well, so add anything i am missing.

**What the AI did:** Filled in `tests/money.test.js` under the user's own section comments. It fixed that file's import, which had been changed to `readError` while the tests still call `money`. It also wrote `tests/readError.test.js` and `tests/splitSummary.test.js` in the same style, with an input/output comment at the top and a comment heading for each group. That makes 58 tests covering edge values, wrong types, missing properties and malformed payloads. The tests assert the intended behaviour, so 6 fail against the current code. The AI left the code alone, as the assignment asks:
- `money(-0.001)` gives `−$0.00`
- `readError` returns `""` for an empty-string detail
- `readError` gives `undefined: bad` for an empty `loc`
- `readError` crashes on `detail: [null]`
- an even split for one person loses a cent because of float rounding (`0.29`, `1.15`)

## 7. Commit and push

**Prompt:**

> please commit all the changes in tally-testing to https://github.com/agongster/tally-testing.git

**What the AI did:** Made three commits and pushed `main` to the GitHub repo. The commits are the logic extraction (`c682606`), the TESTING.md outline and prompt log (`bd00d2c`), and the test suite alone (`c28acc6`), which keeps the tests-only commit clean for the verifier diff.

## 8. Remove unneeded files

**Prompt:**

> delete all files in the repo that are not necessary for this testing assignment.

**What the AI did:** Checked every tracked file against what the page loads and what the assignment requires. The only file needed by neither was `README.md`, the old portfolio README for Tally, so it was removed with `git rm`. Nothing was committed.

## 9. Track the test results

**Prompt:**

> can you make an md file tracking all this information about the testing? include the change made in logic.js, and the tests that broke after running it, as well as anything else i instruct you to add.

**What the AI did:** Created `test_results.md`. It records the baseline run (6 failing tests from pre-existing bugs, each with input, expected and actual output) and Break 1, the user's `<` → `<=` change in `money`. For Break 1 it lists the diff and the 3 newly failing tests with their failure message. The AI made no changes to code or tests.

## 10. CI workflow

**Prompt:** (the user pasted Step 6's workflow file from the assignment)

> Create .github/workflows/tests.yml:
>
> name: tests
>
> on: [push, pull_request]
>
> jobs:
>   test:
>     runs-on: ubuntu-latest
>     steps:
>       - uses: actions/checkout@v7
>       - uses: actions/setup-node@v7
>         with:
>           node-version: "26"
>       - run: node --test

**What the AI did:** Created `.github/workflows/tests.yml` with exactly that content and checked that it parses as YAML. Nothing was committed or pushed.

## 11. Undo the break and fix the baseline bugs

**Prompt:**

> undo the change i made, and fix the 6 bugs that existed before.

**What the AI did:** Reverted the user's `<=` break with `git checkout -- logic.js`. Then fixed the 6 pre-existing bugs, changing only `logic.js`:
- `money` decides the minus sign after rounding
- `readError` ignores an empty-string detail, an empty `loc` and a non-object first entry
- the even split uses integer cents

The result is 58 of 58 tests passing. It confirmed with `git diff c28acc6 -- tests` that no test changed. The fixes were recorded in `test_results.md`. Nothing was committed.

## 12. Commit and push for a green CI run

**Prompt:**

> yes

(Answering: "commit the bug fixes on their own, then commit the workflow file, `test_results.md`, the `README.md` deletion and the log, and push. Should I do that?")

**What the AI did:** Committed the `logic.js` fixes on their own, then committed the CI workflow, `test_results.md`, the `README.md` removal and the prompt log, and pushed to `origin/main`. CI passed: https://github.com/agongster/tally-testing/actions/runs/43497195130

## 13. Push a deliberate break for a red CI run

**Prompt:**

> i made the change, push it and grab the red run's link.

**What the AI did:** Ran the suite locally before pushing. The user's change (`<` → `<=` in `money`, after the bug fix) left all 58 tests passing, because once the code checks for `"0.00"` the change makes no difference. The AI did not push, recorded the attempt in `test_results.md`, and suggested one-line breaks that would actually fail.
