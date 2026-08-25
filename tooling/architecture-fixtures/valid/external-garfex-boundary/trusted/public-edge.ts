import type { AuthenticationComposition } from "../../../../../apps/backend/src/auth/composition.js";
import type {
  ActorContext,
  ResourceMaster,
} from "../../../../../apps/backend/src/resource-master/public.js";

export type TrustedPublicEdge = {
  readonly actor: ActorContext;
  readonly composition: AuthenticationComposition;
  readonly resourceMaster: ResourceMaster;
};
