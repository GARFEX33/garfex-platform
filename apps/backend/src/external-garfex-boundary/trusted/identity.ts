import type { AuthenticationComposition } from "../../auth/composition.js";
import type { ActorContext, ActorId, Capability } from "../../resource-master/public.js";

export interface TrustedActorResolver {
  resolveActor(): Promise<ActorContext | null>;
}

const freshActorContext = (
  actorId: ActorId,
  serverCapabilities: ReadonlySet<Capability>,
): ActorContext => ({
  actorId,
  capabilities: new Set(serverCapabilities),
});

export const createTrustedActorResolver = (
  composition: AuthenticationComposition | null,
): TrustedActorResolver => ({
  resolveActor: async (): Promise<ActorContext | null> => {
    if (composition === null) return null;

    let actorId: ActorId | null;
    try {
      actorId = await composition.identityAdapter.resolveActorId();
    } catch {
      return null;
    }

    if (actorId === null) return null;
    return freshActorContext(actorId, composition.capabilities);
  },
});
