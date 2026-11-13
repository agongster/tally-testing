import { test } from "node:test";
import assert from "node:assert/strict";
import { money } from "../logic.js";

// basic testing positive int input
// input: value
// output: string of value in dollar form
// e.g. 3 -> "$3.00"
// note: negatives use the Unicode minus sign "−" (U+2212), not a hyphen "-"

test("positive int input", () => {
    assert.equal(money(3), "$3.00")
})

// test negative int inputs

test("negative int gets a leading minus sign before the $", () => {
    assert.equal(money(-3), "−$3.00")
})

test("negative sign is the Unicode minus, not an ASCII hyphen", () => {
    assert.equal(money(-3).codePointAt(0), 0x2212)
})

// test zero inputs

test("zero has no minus sign", () => {
    assert.equal(money(0), "$0.00")
})

test("negative zero has no minus sign", () => {
    assert.equal(money(-0), "$0.00")
})

test("a tiny negative that rounds to zero has no minus sign", () => {
    assert.equal(money(-0.001), "$0.00")
})

// test floats

test("float with one decimal is padded to two", () => {
    assert.equal(money(12.5), "$12.50")
})

test("float with exactly two decimals is unchanged", () => {
    assert.equal(money(83.47), "$83.47")
})

test("negative float", () => {
    assert.equal(money(-18.75), "−$18.75")
})

test("value under a dollar keeps the leading zero", () => {
    assert.equal(money(0.05), "$0.05")
})

// test floats with more than 2 decimals

test("third decimal of 5 or more rounds up", () => {
    assert.equal(money(3.456), "$3.46")
})

test("third decimal under 5 rounds down", () => {
    assert.equal(money(3.454), "$3.45")
})

test("negative float rounds the same way as positive", () => {
    assert.equal(money(-3.456), "−$3.46")
})

// test integer overflow

test("large amount has no thousands separators", () => {
    assert.equal(money(1000000), "$1000000.00")
})

test("largest safe integer is still written out in full", () => {
    assert.equal(money(Number.MAX_SAFE_INTEGER), "$9007199254740991.00")
})

// test non-integer inputs

test("numeric string is formatted like the number", () => {
    assert.equal(money("12.5"), "$12.50")
})

test("negative numeric string gets a minus sign", () => {
    assert.equal(money("-4"), "−$4.00")
})

test("null is treated as zero", () => {
    assert.equal(money(null), "$0.00")
})
