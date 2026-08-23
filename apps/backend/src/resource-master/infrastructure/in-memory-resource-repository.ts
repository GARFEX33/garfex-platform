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

  async updateNaturalUnit({
    resourceId,
    expectedRevision,
    naturalUnitCode,
    searchProjection,
  }: Parameters<ResourceRepository["updateNaturalUnit"]>[0]) {
    const current = this.#byId.get(resourceId);
    if (current === undefined) return { kind: "NOT_FOUND" as const };
    if (current.revision !== expectedRevision) {
      return { kind: "CONFLICT" as const, currentRevision: current.revision };
    }
    if (!current.active) return { kind: "INVALID_LIFECYCLE" as const };
    if (current.naturalUnitCode === naturalUnitCode) {
      return { kind: "UPDATED" as const, resource: structuredClone(current) };
    }
    const next = {
      ...current,
      naturalUnitCode,
      revision: current.revision + 1,
    };
    const updated = { ...next, searchProjection: searchProjection(next) };
    this.#byId.set(resourceId, updated);
    return { kind: "UPDATED" as const, resource: structuredClone(updated) };
  }

  async deactivate({
    resourceId,
    expectedRevision,
  }: Parameters<ResourceRepository["deactivate"]>[0]) {
    const current = this.#byId.get(resourceId);
    if (current === undefined) return { kind: "NOT_FOUND" as const };
    if (current.revision !== expectedRevision) {
      return { kind: "CONFLICT" as const, currentRevision: current.revision };
    }
    if (!current.active) return { kind: "INVALID_LIFECYCLE" as const };
    const updated = { ...current, active: false, revision: current.revision + 1 };
    this.#byId.set(resourceId, updated);
    return { kind: "UPDATED" as const, resource: structuredClone(updated) };
  }

  async getByResourceId(resourceId: string) {
    const resource = this.#byId.get(resourceId);
    return resource === undefined ? null : structuredClone(resource);
  }

  async listPage({
    lifecycle,
    afterResourceId,
    limit,
  }: Parameters<ResourceRepository["listPage"]>[0]) {
    const resources = [...this.#byId.values()]
      .filter(
        (resource) =>
          (lifecycle === "ALL" || resource.active === (lifecycle === "ACTIVE")) &&
          (afterResourceId === undefined || resource.resourceId > afterResourceId),
      )
      .sort((left, right) =>
        left.resourceId < right.resourceId ? -1 : left.resourceId > right.resourceId ? 1 : 0,
      );
    const selected = resources.slice(0, limit);
    return {
      resources: structuredClone(selected),
      lastScannedResourceId: selected.at(-1)?.resourceId ?? null,
      hasMore: resources.length > limit,
    };
  }
}
