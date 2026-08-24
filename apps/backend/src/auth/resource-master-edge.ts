import type { ActorContext, ActorId, Result } from "../resource-master/public.js";
import type { AuthenticationComposition } from "./composition.js";

const unauthenticated = (): Result<never> => ({
  ok: false,
  error: { code: "UNAUTHENTICATED", message: "authentication is required" },
});

export const invokeAuthenticatedResourceMasterOperation = async <T>(
  composition: AuthenticationComposition | null,
  invoke: (actor: ActorContext) => Promise<Result<T>>,
): Promise<Result<T>> => {
  if (composition === null) return unauthenticated();
  let actorId: ActorId | null;
  try {
    actorId = await composition.identityAdapter.resolveActorId();
  } catch {
    return unauthenticated();
  }
  if (actorId === null) return unauthenticated();
  return invoke({ actorId, capabilities: composition.capabilities });
};
