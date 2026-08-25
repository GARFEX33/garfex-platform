import type { Doc } from "../../../../apps/backend/convex/_generated/dataModel.js";
import type { ResourceRepository } from "../../../../apps/backend/src/resource-master/application/ports/resource-repository.js";

export type LeakedClientContract = Readonly<{
  actor: ActorContext;
  role: Role;
  capability: Capability;
  resource: ResourceRepository;
  document: Doc<"resources">;
}>;
