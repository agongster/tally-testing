import { test } from "node:test";
import assert from "node:assert/strict";
import { splitSummary } from "../logic.js";

// input: { amount, splitType, exactShares, participantCount }
//   amount           - the expense amount (string from the form, or a number)
//   splitType        - "exact" or "even"
//   exactShares      - "exact" only: the raw value typed into each person's share box
//   participantCount - "even" only: how many people are checked
// output: { text, mismatch } - the preview line under the form, and whether it is flagged red
// e.g. { amount: "10", splitType: "even", participantCount: 2 } -> { text: "$5.00 each.", mismatch: false }

const empty = { text: "", mismatch: false }

// test invalid amounts (no preview at all, in either split type)

test("blank amount shows nothing", () => {
    assert.deepEqual(splitSummary({ amount: "", splitType: "even", participantCount: 2 }), empty)
})

test("zero amount shows nothing", () => {
    assert.deepEqual(splitSummary({ amount: "0", splitType: "even", participantCount: 2 }), empty)
})

test("negative amount shows nothing", () => {
    assert.deepEqual(splitSummary({ amount: "-5", splitType: "even", participantCount: 2 }), empty)
})

test("non-numeric amount shows nothing", () => {
    assert.deepEqual(splitSummary({ amount: "abc", splitType: "even", participantCount: 2 }), empty)
})

test("invalid amount shows nothing in exact mode too", () => {
    assert.deepEqual(splitSummary({ amount: "0", splitType: "exact", exactShares: ["5"] }), empty)
})

test("amount as a number works the same as a string", () => {
    assert.deepEqual(
        splitSummary({ amount: 10, splitType: "even", participantCount: 2 }),
        splitSummary({ amount: "10", splitType: "even", participantCount: 2 })
    )
})

// test even split

test("even split that divides cleanly", () => {
    assert.deepEqual(
        splitSummary({ amount: "10", splitType: "even", participantCount: 2 }),
        { text: "$5.00 each.", mismatch: false }
    )
})

test("even split with leftover cents mentions the rounding", () => {
    assert.deepEqual(
        splitSummary({ amount: "10", splitType: "even", participantCount: 3 }),
        { text: "$3.33 each, with $0.01 of rounding spread across the first few.", mismatch: false }
    )
})

test("even split of a few cents: 5 cents across 3 is 1 cent each, 2 cents left over", () => {
    assert.equal(
        splitSummary({ amount: "0.05", splitType: "even", participantCount: 3 }).text,
        "$0.01 each, with $0.02 of rounding spread across the first few."
    )
})

test("even split for one person is the whole amount", () => {
    assert.deepEqual(
        splitSummary({ amount: "25", splitType: "even", participantCount: 1 }),
        { text: "$25.00 each.", mismatch: false }
    )
})

test("even split for one person keeps every cent (no float rounding loss)", () => {
    assert.equal(splitSummary({ amount: "0.29", splitType: "even", participantCount: 1 }).text, "$0.29 each.")
})

test("even split for one person keeps every cent (another float-unfriendly amount)", () => {
    assert.equal(splitSummary({ amount: "1.15", splitType: "even", participantCount: 1 }).text, "$1.15 each.")
})

test("even split with nobody checked asks to pick someone", () => {
    assert.deepEqual(
        splitSummary({ amount: "10", splitType: "even", participantCount: 0 }),
        { text: "Pick at least one person.", mismatch: false }
    )
})

test("even split with participantCount left out asks to pick someone", () => {
    assert.equal(splitSummary({ amount: "10", splitType: "even" }).text, "Pick at least one person.")
})

test("even split is never flagged as a mismatch", () => {
    assert.equal(splitSummary({ amount: "10", splitType: "even", participantCount: 3 }).mismatch, false)
})

test("any splitType other than 'exact' is treated as even", () => {
    assert.equal(splitSummary({ amount: "10", splitType: undefined, participantCount: 2 }).text, "$5.00 each.")
})

// test exact split

test("exact shares that add up are confirmed and not flagged", () => {
    assert.deepEqual(
        splitSummary({ amount: "10", splitType: "exact", exactShares: ["4", "6"] }),
        { text: "The shares add up. ✓", mismatch: false }
    )
})

test("exact shares under the total show what is left, flagged", () => {
    assert.deepEqual(
        splitSummary({ amount: "10", splitType: "exact", exactShares: ["4", ""] }),
        { text: "$6.00 left to assign.", mismatch: true }
    )
})

test("exact shares over the total show the excess, flagged", () => {
    assert.deepEqual(
        splitSummary({ amount: "10", splitType: "exact", exactShares: ["4", "7"] }),
        { text: "$1.00 over the expense total.", mismatch: true }
    )
})

test("exact shares off by exactly one cent are flagged", () => {
    assert.deepEqual(
        splitSummary({ amount: "10", splitType: "exact", exactShares: ["9.99"] }),
        { text: "$0.01 left to assign.", mismatch: true }
    )
})

test("exact shares with float drift (0.1 + 0.2) still add up to 0.3", () => {
    assert.equal(splitSummary({ amount: "0.3", splitType: "exact", exactShares: ["0.1", "0.2"] }).mismatch, false)
})

test("blank and non-numeric shares count as zero", () => {
    assert.equal(
        splitSummary({ amount: "10", splitType: "exact", exactShares: ["", "abc", "4"] }).text,
        "$6.00 left to assign."
    )
})

test("no share boxes at all leaves the whole amount to assign", () => {
    assert.equal(splitSummary({ amount: "10", splitType: "exact", exactShares: [] }).text, "$10.00 left to assign.")
})

test("exactShares left out leaves the whole amount to assign", () => {
    assert.equal(splitSummary({ amount: "10", splitType: "exact" }).text, "$10.00 left to assign.")
})

test("shares given as numbers work the same as strings", () => {
    assert.equal(splitSummary({ amount: "10", splitType: "exact", exactShares: [4, 6] }).text, "The shares add up. ✓")
})
