import type { ResourceRepository } from "../application/ports/resource-repository.js";
import type { PersistedResource } from "../domain/types.js";

export class InMemoryResourceRepository implements ResourceRepository {
  readonly #byId = new Map<string, PersistedResource>();
  readonly #byIdentity = new Map<string, string>();

  async createIfIdentityAbsent(resource: PersistedResource) {
    const existingResourceId = this.#byIdentity.get(resource.canonicalIdentity);
    if (existingResourceId !== undefined) return { kind: "DUPLICATE" as const, existingResourceId };
    this.#byIdentity.set(resource.canonicalIdentity, resource.resourceId);
    this.#byId.set(resource.resourceId, structuredClone(resource));
    return { kind: "CREATED" as const };
  }

  async getByResourceId(resourceId: string) {
    const resource = this.#byId.get(resourceId);
    return resource === undefined ? null : structuredClone(resource);
  }

  async listActivePage({ offset, limit }: { readonly offset: number; readonly limit: number }) {
    const resources = [...this.#byId.values()]
      .filter((resource) => resource.active)
      .sort((left, right) => left.resourceId.localeCompare(right.resourceId));
    return {
      resources: structuredClone(resources.slice(offset, offset + limit)),
      hasMore: offset + limit < resources.length,
    };
  }
}
