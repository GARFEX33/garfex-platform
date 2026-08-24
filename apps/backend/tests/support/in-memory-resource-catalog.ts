import {
  ResourceCatalogReadError,
  type ResourceCatalogReader,
} from "../../src/resource-master/application/ports/resource-catalog-reader.js";
import {
  parseResourceCatalogSnapshot,
  type ResourceCatalogSnapshot,
} from "../../src/resource-master/domain/catalog-snapshot.js";
import { cableCatalog } from "../fixtures/cable-catalog.js";

export const validResourceCatalogSnapshot = parseResourceCatalogSnapshot({
  catalogKey: "resource-master",
  schemaVersion: 1,
  sourceVersion: "cable-catalog-v1",
  lifecycle: "ACTIVE",
  catalog: cableCatalog,
  revision: 1,
});

export type InMemoryResourceCatalogState =
  | "valid"
  | "unavailable"
  | "uninitialized"
  | "empty"
  | "invalid"
  | "thrown";

export class InMemoryResourceCatalogReader implements ResourceCatalogReader {
  readonly #state: InMemoryResourceCatalogState;
  readonly #snapshot: ResourceCatalogSnapshot;
  loadCount = 0;

  constructor(
    state: InMemoryResourceCatalogState = "valid",
    snapshot: ResourceCatalogSnapshot = validResourceCatalogSnapshot,
  ) {
    this.#state = state;
    this.#snapshot = snapshot;
  }

  async loadSnapshot(): Promise<ResourceCatalogSnapshot> {
    this.loadCount += 1;
    switch (this.#state) {
      case "valid":
        return this.#snapshot;
      case "unavailable":
        throw new ResourceCatalogReadError("RESOURCE_CATALOG_UNAVAILABLE", {
          cause: new Error("storage document secret: catalog-123"),
        });
      case "uninitialized":
      case "empty":
        throw new ResourceCatalogReadError("RESOURCE_CATALOG_UNINITIALIZED");
      case "invalid":
        throw new ResourceCatalogReadError("RESOURCE_CATALOG_INVALID", {
          cause: new Error("convex document shape secret: catalog-123"),
        });
      case "thrown":
        throw new Error("convex document secret: catalog-123");
    }
  }
}
