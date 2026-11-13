import { test } from "node:test";
import assert from "node:assert/strict";
import { readError } from "../logic.js";

// input: payload (the parsed JSON body of a failed response), status (HTTP status code)
// output: one line of text to show the user
// e.g. { detail: "Incorrect email or password." }, 401 -> "Incorrect email or password."
// FastAPI sends detail either as a string, or as a list of validation errors
// shaped like { loc: ["body", "amount"], msg: "..." }

// test string detail

test("string detail is returned as-is", () => {
    assert.equal(readError({ detail: "Incorrect email or password." }, 401), "Incorrect email or password.")
})

test("empty string detail falls back to the generic message", () => {
    assert.equal(readError({ detail: "" }, 400), "Something went wrong (400).")
})

// test validation-error list detail

test("list detail reports the field name and message", () => {
    const payload = { detail: [{ loc: ["body", "amount"], msg: "must be greater than 0" }] }
    assert.equal(readError(payload, 422), "amount: must be greater than 0")
})

test("field name is the last entry of loc, not the first", () => {
    const payload = { detail: [{ loc: ["body", "shares", 0, "amount"], msg: "bad" }] }
    assert.equal(readError(payload, 422), "amount: bad")
})

test("only the first error in the list is reported", () => {
    const payload = {
        detail: [
            { loc: ["body", "email"], msg: "invalid email" },
            { loc: ["body", "password"], msg: "too short" },
        ],
    }
    assert.equal(readError(payload, 422), "email: invalid email")
})

test("missing loc uses 'input' as the field name", () => {
    assert.equal(readError({ detail: [{ msg: "bad" }] }, 422), "input: bad")
})

test("non-array loc uses 'input' as the field name", () => {
    assert.equal(readError({ detail: [{ loc: "amount", msg: "bad" }] }, 422), "input: bad")
})

test("empty loc uses 'input' as the field name", () => {
    assert.equal(readError({ detail: [{ loc: [], msg: "bad" }] }, 422), "input: bad")
})

// test fallback to the generic message

test("empty list detail falls back and includes the status", () => {
    assert.equal(readError({ detail: [] }, 422), "Something went wrong (422).")
})

test("payload with no detail falls back", () => {
    assert.equal(readError({}, 500), "Something went wrong (500).")
})

test("null payload (non-JSON response) falls back", () => {
    assert.equal(readError(null, 502), "Something went wrong (502).")
})

test("undefined payload falls back", () => {
    assert.equal(readError(undefined, 503), "Something went wrong (503).")
})

test("detail of an unexpected type (object) falls back", () => {
    assert.equal(readError({ detail: { msg: "bad" } }, 400), "Something went wrong (400).")
})

test("detail of an unexpected type (number) falls back", () => {
    assert.equal(readError({ detail: 42 }, 400), "Something went wrong (400).")
})

// test malformed list entries

test("null first entry falls back instead of crashing", () => {
    assert.equal(readError({ detail: [null] }, 422), "Something went wrong (422).")
})
