// logic.js -- pure logic for Tally, no page and no DOM.
// app.js imports these and handles everything that reads or writes the page.

/** Format a dollar amount, e.g. 12.5 -> "$12.50", -3 -> "−$3.00". */
export const money = (value) => {
  const digits = Math.abs(value).toFixed(2);
  // Only show a minus sign if the amount is still negative after rounding to cents.
  return `${value > 0 && digits !== "0.00" ? "−" : ""}$${digits}`;
};

/** FastAPI reports validation problems as a list; flatten either shape to a line. */
export function readError(payload, status) {
  const detail = payload && payload.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length && detail[0] && typeof detail[0] === "object") {
    const first = detail[0];
    const field =
      Array.isArray(first.loc) && first.loc.length ? first.loc[first.loc.length - 1] : "input";
    return `${field}: ${first.msg}`;
  }
  return `Something went wrong (${status}).`;
}

/**
 * The live split preview under the expense form, computed from plain values.
 *
 *   amount           - the expense amount field's value (string or number)
 *   splitType        - "exact" or "even"
 *   exactShares      - for "exact": the raw value of each per-person share input
 *   participantCount - for "even": how many participant boxes are checked
 *
 * Returns { text, mismatch }: the summary line and whether to flag it as a mismatch.
 * The server recomputes all of this on submit.
 */
export function splitSummary({ amount, splitType, exactShares = [], participantCount = 0 }) {
  const total = Number(amount);

  if (!total || total <= 0) {
    return { text: "", mismatch: false };
  }

  if (splitType === "exact") {
    const entered = exactShares.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const difference = Number((total - entered).toFixed(2));
    return {
      mismatch: difference !== 0,
      text:
        difference === 0
          ? "The shares add up. ✓"
          : difference > 0
          ? `${money(difference)} left to assign.`
          : `${money(-difference)} over the expense total.`,
    };
  }

  if (!participantCount) {
    return { text: "Pick at least one person.", mismatch: false };
  }
  // Mirrors the server's rule: leftover cents go to the earliest members.
  // Work in whole cents: total * 100 can land just under an integer (0.29 * 100 = 28.999...).
  const totalCents = Math.round(total * 100);
  const eachCents = Math.floor(totalCents / participantCount);
  const each = eachCents / 100;
  const leftover = (totalCents - eachCents * participantCount) / 100;
  return {
    mismatch: false,
    text:
      leftover === 0
        ? `${money(each)} each.`
        : `${money(each)} each, with ${money(leftover)} of rounding spread across the first few.`,
  };
}
