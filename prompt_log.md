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
