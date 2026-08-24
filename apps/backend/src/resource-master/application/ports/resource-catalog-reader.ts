import type { ResourceCatalogSnapshot } from "../../domain/catalog-snapshot.js";

export const resourceCatalogReadCodes = [
  "RESOURCE_CATALOG_UNAVAILABLE",
  "RESOURCE_CATALOG_UNINITIALIZED",
  "RESOURCE_CATALOG_INVALID",
] as const;
export type ResourceCatalogReadCode = (typeof resourceCatalogReadCodes)[number];

export class ResourceCatalogReadError extends Error {
  constructor(
    readonly code: ResourceCatalogReadCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "ResourceCatalogReadError";
  }
}

export interface ResourceCatalogReader {
  loadSnapshot(): Promise<ResourceCatalogSnapshot>;
}
