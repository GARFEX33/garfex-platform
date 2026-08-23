import type { PersistedResource } from "../../domain/types.js";

export type PersistResult =
  | { readonly kind: "CREATED" }
  | { readonly kind: "DUPLICATE"; readonly existingResourceId: string };

export interface ResourceRepository {
  createIfIdentityAbsent(resource: PersistedResource): Promise<PersistResult>;
  getByResourceId(resourceId: string): Promise<PersistedResource | null>;
  listActivePage(input: { readonly offset: number; readonly limit: number }): Promise<{
    readonly resources: readonly PersistedResource[];
    readonly hasMore: boolean;
  }>;
}
