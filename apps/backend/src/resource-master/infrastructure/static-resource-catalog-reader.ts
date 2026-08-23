import { parseResourceCatalogSnapshot } from "../domain/catalog-snapshot.js";
import type { ResourceCatalogReader } from "../application/ports/resource-catalog-reader.js";
import { cableCatalog } from "./cable-catalog.js";

export class StaticResourceCatalogReader implements ResourceCatalogReader {
  async loadSnapshot() {
    return parseResourceCatalogSnapshot({
      catalogKey: "resource-master",
      schemaVersion: 1,
      sourceVersion: "cable-catalog-v1",
      lifecycle: "ACTIVE",
      catalog: cableCatalog,
      revision: 1,
    });
  }
}
