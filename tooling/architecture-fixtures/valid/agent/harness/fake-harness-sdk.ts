import type { Decision } from "../core/decision.js";

export interface FakeHarnessSdk {
  record(decision: Decision): Promise<void>;
}
