import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api.js";
import schema from "../convex/schema.js";
import { jdS002Cases, type JdS002Case } from "./smoke/jd-s-002-cases.js";

process.env.GARFEX_RUNTIME_ENV = "local-development";
process.env.GARFEX_AUTH_MODE = "local-development";

const modules = (
  import.meta as ImportMeta & {
    glob(pattern: string): Record<string, () => Promise<unknown>>;
  }
).glob("../convex/**/*.ts");

type TestHandle = ReturnType<typeof convexTest>;

function callCase(t: TestHandle, testCase: JdS002Case): Promise<unknown> {
  switch (testCase.operation) {
    case "getResource":
      return t.query(api.resourceMaster.getResource, testCase.args as never);
    case "searchResources":
      return t.query(api.resourceMaster.searchResources, testCase.args as never);
    case "createResource":
      return t.mutation(api.resourceMaster.createResource, testCase.args as never);
    case "updateNonIdentityData":
      return t.mutation(api.resourceMaster.updateNonIdentityData, testCase.args as never);
  }
}

function assertCanonicalOutcome(value: unknown, testCase: JdS002Case): void {
  expect(value, testCase.id).toMatchObject({ ok: expect.any(Boolean) });
  if (testCase.category === "canonical-invalid") {
    expect(value, testCase.id).toMatchObject({
      ok: false,
      error: { code: testCase.expectedErrorCode, fieldIssues: expect.any(Array) },
    });
  }
}

describe("JD-S-002 shared matrix in convex-test", () => {
  it.each(jdS002Cases)("classifies $id as $category", async (testCase) => {
    const t = convexTest(schema, modules);
    let value: unknown;
    let rejected = false;
    try {
      value = await callCase(t, testCase);
    } catch {
      rejected = true;
    }

    if (testCase.category === "transport-rejection") {
      expect(rejected, testCase.id).toBe(true);
      expect(testCase.expectedDownstreamWork).toBe("not-invoked");
      return;
    }

    expect(rejected, testCase.id).toBe(false);
    assertCanonicalOutcome(value, testCase);
    expect(testCase.expectedDownstreamWork).toBe(
      testCase.category === "canonical-invalid" ? "not-invoked" : "invoked",
    );
  });

  it("preserves the matrix's in-process-only downstream consequence contract", () => {
    expect(
      jdS002Cases.filter(({ expectedDownstreamWork }) => expectedDownstreamWork === "not-invoked"),
    ).not.toHaveLength(0);
    expect(
      jdS002Cases.filter(({ expectedDownstreamWork }) => expectedDownstreamWork === "invoked"),
    ).not.toHaveLength(0);
  });
});
