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

  async getByResourceId(resourceId: string) {
    const header = await this.db
      .query("resources")
      .withIndex("by_resource_id", (query) => query.eq("resourceId", resourceId))
      .unique();
    return header === null ? null : reconstruct(this.db, header);
  }

  async listActivePage({ offset, limit }: { readonly offset: number; readonly limit: number }) {
    const headers = await this.db
      .query("resources")
      .withIndex("by_active_resource_id", (query) => query.eq("active", true))
      .order("asc")
      .take(offset + limit + 1);
    const selected = headers.slice(offset, offset + limit);
    return {
      resources: await Promise.all(selected.map((header) => reconstruct(this.db, header))),
      hasMore: headers.length > offset + limit,
    };
  }
}
