import type { IdentityAdapter } from "./identity-adapter.js";

export const localDevelopmentIdentityAdapter: IdentityAdapter = {
  resolveActorId: async () => "garfex-actor:local-development",
};
