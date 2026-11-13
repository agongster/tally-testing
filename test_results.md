# Test results log

Results of running `node --test` from the repo root, as they happened. Tests are
unchanged from the tests-only commit `c28acc6` unless noted.

## Baseline: before any break-it changes

`logic.js` as of commit `c682606`. **58 tests, 52 pass, 6 fail.** These 6 fail on
real bugs that were in the original code. They were not deliberately broken.

| Test (file:line) | Input | Expected | Actual |
|---|---|---|---|
| a tiny negative that rounds to zero has no minus sign (`money.test.js:35`) | `money(-0.001)` | `"$0.00"` | `"−$0.00"` |
| empty string detail falls back to the generic message (`readError.test.js:17`) | `readError({ detail: "" }, 400)` | `"Something went wrong (400)."` | `""` |
| empty loc uses 'input' as the field name (`readError.test.js:51`) | `readError({ detail: [{ loc: [], msg: "bad" }] }, 422)` | `"input: bad"` | `"undefined: bad"` |
| null first entry falls back instead of crashing (`readError.test.js:83`) | `readError({ detail: [null] }, 422)` | `"Something went wrong (422)."` | throws `TypeError: Cannot read properties of null (reading 'loc')` |
| even split for one person keeps every cent (no float rounding loss) (`splitSummary.test.js:74`) | `splitSummary({ amount: "0.29", splitType: "even", participantCount: 1 })` | text `"$0.29 each."` | text `"$0.28 each, with $0.01 of rounding spread across the first few."` |
| even split for one person keeps every cent (another float-unfriendly amount) (`splitSummary.test.js:78`) | `splitSummary({ amount: "1.15", splitType: "even", participantCount: 1 })` | text `"$1.15 each."` | text `"$1.14 each, with $0.01 of rounding spread across the first few."` |

## Break 1: `money` uses `<=` instead of `<`

**Change** (`logic.js:6`, in `money`):

```diff
-  `${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(2)}`;
+  `${value <= 0 ? "−" : ""}$${Math.abs(value).toFixed(2)}`;
```

**Result:** 58 tests, 49 pass, 9 fail. This is 3 more failures than the baseline.

**Newly failing tests (caught the break):**

| Test (file:line) | Input | Expected | Actual |
|---|---|---|---|
| zero has no minus sign (`money.test.js:27`) | `money(0)` | `"$0.00"` | `"−$0.00"` |
| negative zero has no minus sign (`money.test.js:31`) | `money(-0)` | `"$0.00"` | `"−$0.00"` |
| null is treated as zero (`money.test.js:91`) | `money(null)` | `"$0.00"` | `"−$0.00"` |

Failure message (the same for all three):

```
expected: '$0.00'
actual: '−$0.00'
```

**Still failing from the baseline:** the 6 tests listed above. `money(-0.001)` was
already failing, so it does not count as catching this break.

**Break 1 undone:** `logic.js` was restored with `git checkout -- logic.js`.

## Fixing the 6 baseline bugs

These fixes change only `logic.js`. `git diff c28acc6 -- tests` is empty, so the
tests are unchanged since the tests-only commit.

| Bug | Fix in `logic.js` | Test(s) now passing |
|---|---|---|
| `money` added a minus sign before rounding, so `-0.001` became `−$0.00` | Round first, and only add `−` if the value is negative **and** the rounded digits aren't `0.00` | a tiny negative that rounds to zero has no minus sign |
| `readError` returned an empty-string `detail` as the message | Return a string `detail` only if it is non-empty | empty string detail falls back to the generic message |
| `readError` used `loc[loc.length - 1]` on an empty `loc`, giving `undefined` | Use `"input"` unless `loc` is a non-empty array | empty loc uses 'input' as the field name |
| `readError` read `.loc` from a `null` first entry and crashed | Only read the list if its first entry is a non-null object, otherwise fall back | null first entry falls back instead of crashing |
| Even split did `Math.floor(total * 100 / n)`, and `0.29 * 100 = 28.999…` lost a cent | Convert to whole cents with `Math.round(total * 100)`, then divide and compute the leftover in integer cents | even split for one person keeps every cent (0.29 and 1.15) |

**Result:** 58 tests, **58 pass, 0 fail.**
