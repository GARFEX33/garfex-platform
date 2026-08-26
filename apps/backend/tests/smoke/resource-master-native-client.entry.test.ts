import { describe, expect, it } from "vitest";
import { main, runNativeSmokeIfEnabled } from "./resource-master-native-client.js";

const liveSmokeEnabled = process.env.GARFEX_NATIVE_SMOKE_ENABLE === "1";

describe("Resource Master native client smoke entrypoint", () => {
  it("runs the injected runner zero times when disabled", async () => {
    let calls = 0;
    await runNativeSmokeIfEnabled(false, async () => {
      calls += 1;
    });
    expect(calls).toBe(0);
  });

  it("runs the injected runner once when enabled and propagates failure", async () => {
    let calls = 0;
    const failure = new Error("controlled smoke failure");
    await expect(
      runNativeSmokeIfEnabled(true, async () => {
        calls += 1;
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(calls).toBe(1);
  });

  it("uses the guarded production entrypoint", async () => {
    await runNativeSmokeIfEnabled(liveSmokeEnabled, main);
  });
});
