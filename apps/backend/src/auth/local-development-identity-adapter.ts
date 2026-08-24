import type { ActorId, Capability } from "../resource-master/public.js";
import type { IdentityAdapter } from "./identity-adapter.js";

export const LOCAL_DEVELOPMENT_ACTOR_ID = "garfex-actor:local-development" as ActorId;

export const localDevelopmentCapabilities = [
  "resource:read",
  "resource:create",
  "resource:update-non-identity",
  "resource:deactivate",
] as const satisfies readonly Capability[];

export class LocalDevelopmentIdentityAdapter implements IdentityAdapter {
  async resolveActorId(): Promise<ActorId> {
    return LOCAL_DEVELOPMENT_ACTOR_ID;
  }
}
