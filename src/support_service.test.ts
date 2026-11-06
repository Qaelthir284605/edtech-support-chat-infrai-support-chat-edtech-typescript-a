import test from "node:test";
import assert from "node:assert/strict";
import { decideSupport } from "./support_service.ts";

test("a deadline within one day goes to educator reporting", () => {
  const result = decideSupport({ deadlineHours: 18, message: "The upload form is unclear." });
  assert.equal(result.urgent, true);
  assert.equal(result.reportingState, "educator_attention");
});

test("a later deadline remains in learner support", () => {
  const result = decideSupport({ deadlineHours: 72, message: "Where is the reading list?" });
  assert.equal(result.urgent, false);
  assert.equal(result.reportingState, "learner_support");
});
