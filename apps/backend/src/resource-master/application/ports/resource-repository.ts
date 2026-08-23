import type { PersistedResource } from "../../domain/types.js";

export type PersistResult =
  | { readonly kind: "CREATED" }
  | { readonly kind: "DUPLICATE"; readonly existingResourceId: string };

export type RevisionMutationResult =
  | { readonly kind: "UPDATED"; readonly resource: PersistedResource }
  | { readonly kind: "NOT_FOUND" }
  | { readonly kind: "CONFLICT"; readonly currentRevision: number }
  | { readonly kind: "INVALID_LIFECYCLE" };

export interface ResourceRepository {
  createIfIdentityAbsent(resource: PersistedResource): Promise<PersistResult>;
  updateNaturalUnit(input: {
    readonly resourceId: string;
    readonly expectedRevision: number;
    readonly naturalUnitCode: string;
    readonly searchProjection: (resource: PersistedResource) => string;
  }): Promise<RevisionMutationResult>;
  deactivate(input: {
    readonly resourceId: string;
    readonly expectedRevision: number;
  }): Promise<RevisionMutationResult>;
  getByResourceId(resourceId: string): Promise<PersistedResource | null>;
  listPage(input: {
    readonly lifecycle: "ACTIVE" | "INACTIVE" | "ALL";
    readonly offset: number;
    readonly limit: number;
  }): Promise<{
    readonly resources: readonly PersistedResource[];
    readonly hasMore: boolean;
  }>;
}
