import type { GenericDatabaseReader, GenericDatabaseWriter } from "convex/server";
import {
  parseResourceCatalogPayload,
  parseResourceCatalogSnapshot,
  ResourceCatalogValidationError,
  resourceCatalogPayloadEquals,
  resourceCatalogSnapshotEquals,
  validateResourceCatalogReplacement,
} from "../domain/catalog-snapshot.js";
import type { ResourceCatalogSnapshot } from "../domain/catalog-snapshot.js";
import {
  ResourceCatalogReadError,
  type ResourceCatalogReader,
} from "../application/ports/resource-catalog-reader.js";
import type {
  InstallResourceCatalogInput,
  InstallResourceCatalogResult,
  ResourceCatalogInstaller,
} from "../application/ports/resource-catalog-installer.js";
import type { ResourceDataModel } from "./convex-resource-repository.js";

type Reader = GenericDatabaseReader<ResourceDataModel>;
type Writer = GenericDatabaseWriter<ResourceDataModel>;
type Document = ResourceDataModel["resourceCatalogSnapshots"]["document"];
const findDocuments = (db: Reader) =>
  db
    .query("resourceCatalogSnapshots")
    .withIndex("by_catalog_key", (q) => q.eq("catalogKey", "resource-master"))
    .take(2);
const parseDocument = (document: Document): ResourceCatalogSnapshot =>
  parseResourceCatalogSnapshot({
    catalogKey: document.catalogKey,
    schemaVersion: document.schemaVersion,
    sourceVersion: document.sourceVersion,
    lifecycle: document.lifecycle,
    catalog: document.catalog,
    revision: document.revision,
  });
const toDocument = (snapshot: ResourceCatalogSnapshot): Omit<Document, "_id" | "_creationTime"> =>
  snapshot as unknown as Omit<Document, "_id" | "_creationTime">;
const payloadOf = ({ revision: _revision, ...payload }: ResourceCatalogSnapshot) => payload;

export class ConvexResourceCatalogReader implements ResourceCatalogReader {
  constructor(private readonly db: Reader) {}

  async loadSnapshot(): Promise<ResourceCatalogSnapshot> {
    let documents: Document[];
    try {
      documents = await findDocuments(this.db);
    } catch (error) {
      throw new ResourceCatalogReadError("RESOURCE_CATALOG_UNAVAILABLE", { cause: error });
    }
    if (documents.length === 0)
      throw new ResourceCatalogReadError("RESOURCE_CATALOG_UNINITIALIZED");
    if (documents.length > 1) throw new ResourceCatalogReadError("RESOURCE_CATALOG_INVALID");
    const document = documents[0];
    if (document === undefined)
      throw new ResourceCatalogReadError("RESOURCE_CATALOG_UNINITIALIZED");
    try {
      return parseDocument(document);
    } catch (error) {
      const code =
        error instanceof ResourceCatalogValidationError && error.kind === "EMPTY"
          ? "RESOURCE_CATALOG_UNINITIALIZED"
          : "RESOURCE_CATALOG_INVALID";
      throw new ResourceCatalogReadError(code, { cause: error });
    }
  }
}

export class ConvexResourceCatalogInstaller implements ResourceCatalogInstaller {
  constructor(private readonly db: Writer) {}

  private async current(): Promise<{
    document: Document;
    snapshot: ResourceCatalogSnapshot;
  } | null> {
    const documents = await findDocuments(this.db);
    if (documents.length === 0) return null;
    if (documents.length > 1)
      throw new ResourceCatalogValidationError("INVALID", ["duplicate catalog authority"]);
    const document = documents[0];
    if (document === undefined)
      throw new ResourceCatalogValidationError("INVALID", ["catalog document missing"]);
    return { document, snapshot: parseDocument(document) };
  }

  async install(input: InstallResourceCatalogInput): Promise<InstallResourceCatalogResult> {
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0)
      throw new Error("expectedRevision must be a nonnegative safe integer");
    const candidate = parseResourceCatalogPayload(input.candidate);
    const current = await this.current();
    if (
      current !== null &&
      current.snapshot.sourceVersion === candidate.sourceVersion &&
      resourceCatalogPayloadEquals(payloadOf(current.snapshot), candidate)
    )
      return { kind: "UNCHANGED", snapshot: current.snapshot };
    if (
      (current === null && input.expectedRevision !== 0) ||
      (current !== null && input.expectedRevision !== current.snapshot.revision)
    )
      return { kind: "CONFLICT", currentRevision: current?.snapshot.revision ?? 0 };
    validateResourceCatalogReplacement(current?.snapshot ?? null, candidate);
    const next = parseResourceCatalogSnapshot({
      ...candidate,
      revision: (current?.snapshot.revision ?? 0) + 1,
    });
    if (current === null) await this.db.insert("resourceCatalogSnapshots", toDocument(next));
    else await this.db.replace("resourceCatalogSnapshots", current.document._id, toDocument(next));
    const written = await this.current();
    if (written === null || !resourceCatalogSnapshotEquals(next, written.snapshot))
      throw new Error("resource catalog read-back equivalence failed");
    return { kind: "INSTALLED", snapshot: written.snapshot };
  }
}
