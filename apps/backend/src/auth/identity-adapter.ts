import type { ActorId } from "../resource-master/public.js";

export interface IdentityAdapter {
  resolveActorId(): Promise<ActorId | null>;
}
