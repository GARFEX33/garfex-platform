import type {
  DataModelFromSchemaDefinition,
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import type schema from "../../../convex/schema.js";
import type { ResourceRepository } from "../application/ports/resource-repository.js";
import type { PersistedResource } from "../domain/types.js";

export type ResourceDataModel = DataModelFromSchemaDefinition<typeof schema>;
type Reader = GenericDatabaseReader<ResourceDataModel>;
type Writer = GenericDatabaseWriter<ResourceDataModel>;

const reconstruct = async (
  db: Reader,
  header: ResourceDataModel["resources"]["document"],
): Promise<PersistedResource> => {
  const attributes = await db
    .query("resourceAttributes")
    .withIndex("by_resource_code", (query) => query.eq("resourceId", header.resourceId))
    .take(20);
  return {
    resourceId: header.resourceId,
    classCode: header.classCode,
    familyCode: header.familyCode,
    typeCode: header.typeCode,
    naturalUnitCode: header.naturalUnitCode,
    attributes: attributes.map((attribute) => ({
      attributeCode: attribute.attributeCode,
      kind: attribute.kind,
      canonicalIdentity: attribute.canonicalIdentity,
      displayValue: attribute.displayValue,
      storedValue: attribute.storedValue,
      identityParticipating: attribute.identityParticipating,
    })),
    canonicalIdentity: header.canonicalIdentity,
    identityPolicyVersion: header.identityPolicyVersion,
    active: header.active,
    revision: header.revision,
    searchProjection: header.searchProjection,
  };
};

export class ConvexResourceRepository implements ResourceRepository {
  constructor(
    private readonly db: Reader,
    private readonly writer?: Writer,
  ) {}

  async createIfIdentityAbsent(resource: PersistedResource) {
    if (this.writer === undefined) throw new Error("create requires a mutation transaction");
    const existing = await this.writer
      .query("resources")
      .withIndex("by_identity", (query) =>
        query.eq("canonicalIdentity", resource.canonicalIdentity),
      )
      .unique();
    if (existing !== null) {
      return { kind: "DUPLICATE" as const, existingResourceId: existing.resourceId };
    }
    await this.writer.insert("resources", {
      resourceId: resource.resourceId,
      classCode: resource.classCode,
      familyCode: resource.familyCode,
      typeCode: resource.typeCode,
      naturalUnitCode: resource.naturalUnitCode,
      canonicalIdentity: resource.canonicalIdentity,
      identityPolicyVersion: resource.identityPolicyVersion,
      active: resource.active,
      revision: resource.revision,
      searchProjection: resource.searchProjection,
    });
    for (const attribute of resource.attributes) {
      await this.writer.insert("resourceAttributes", {
        resourceId: resource.resourceId,
        attributeCode: attribute.attributeCode,
        kind: attribute.kind,
        canonicalIdentity: attribute.canonicalIdentity,
        displayValue: attribute.displayValue,
        storedValue: attribute.storedValue,
        identityParticipating: attribute.identityParticipating,
      });
    }
    return { kind: "CREATED" as const };
  }

  async updateNaturalUnit({
    resourceId,
    expectedRevision,
    naturalUnitCode,
    searchProjection,
  }: Parameters<ResourceRepository["updateNaturalUnit"]>[0]) {
    if (this.writer === undefined) throw new Error("update requires a mutation transaction");
    const header = await this.writer
      .query("resources")
      .withIndex("by_resource_id", (query) => query.eq("resourceId", resourceId))
      .unique();
    if (header === null) return { kind: "NOT_FOUND" as const };
    if (header.revision !== expectedRevision) {
      return { kind: "CONFLICT" as const, currentRevision: header.revision };
    }
    if (!header.active) return { kind: "INVALID_LIFECYCLE" as const };
    const current = await reconstruct(this.writer, header);
    if (header.naturalUnitCode === naturalUnitCode) {
      return { kind: "UPDATED" as const, resource: current };
    }
    const next = { ...current, naturalUnitCode, revision: current.revision + 1 };
    const updated = { ...next, searchProjection: searchProjection(next) };
    await this.writer.patch(header._id, {
      naturalUnitCode: updated.naturalUnitCode,
      revision: updated.revision,
      searchProjection: updated.searchProjection,
    });
    return { kind: "UPDATED" as const, resource: updated };
  }

  async deactivate({
    resourceId,
    expectedRevision,
  }: Parameters<ResourceRepository["deactivate"]>[0]) {
    if (this.writer === undefined) throw new Error("deactivate requires a mutation transaction");
    const header = await this.writer
      .query("resources")
      .withIndex("by_resource_id", (query) => query.eq("resourceId", resourceId))
      .unique();
    if (header === null) return { kind: "NOT_FOUND" as const };
    if (header.revision !== expectedRevision) {
      return { kind: "CONFLICT" as const, currentRevision: header.revision };
    }
    if (!header.active) return { kind: "INVALID_LIFECYCLE" as const };
    const revision = header.revision + 1;
    await this.writer.patch(header._id, { active: false, revision });
    const resource = await reconstruct(this.writer, { ...header, active: false, revision });
    return { kind: "UPDATED" as const, resource };
  }

  async getByResourceId(resourceId: string) {
    const header = await this.db
      .query("resources")
      .withIndex("by_resource_id", (query) => query.eq("resourceId", resourceId))
      .unique();
    return header === null ? null : reconstruct(this.db, header);
  }

  async listPage({ lifecycle, offset, limit }: Parameters<ResourceRepository["listPage"]>[0]) {
    const headers =
      lifecycle === "ALL"
        ? await this.db
            .query("resources")
            .withIndex("by_resource_id")
            .order("asc")
            .take(offset + limit + 1)
        : await this.db
            .query("resources")
            .withIndex("by_active_resource_id", (query) =>
              query.eq("active", lifecycle === "ACTIVE"),
            )
            .order("asc")
            .take(offset + limit + 1);
    const selected = headers.slice(offset, offset + limit);
    return {
      resources: await Promise.all(selected.map((header) => reconstruct(this.db, header))),
      hasMore: headers.length > offset + limit,
    };
  }
}
