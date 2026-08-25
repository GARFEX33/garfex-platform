import type { ActorContext, ActorId } from "../../resource-master/public.js";
import type { AuthenticationComposition } from "../../auth/composition.js";

export interface TrustedActorResolver {
  resolveActor(): Promise<ActorContext | null>;
}

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
    return { actorId, capabilities: new Set(composition.capabilities) };
  },
});
