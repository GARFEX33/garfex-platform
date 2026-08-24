import type {
  ResourceCatalogPayload,
  ResourceCatalogSnapshot,
} from "../../domain/catalog-snapshot.js";

export interface InstallResourceCatalogInput {
  readonly expectedRevision: number;
  readonly candidate: ResourceCatalogPayload;
}

export type InstallResourceCatalogResult =
  | { readonly kind: "INSTALLED"; readonly snapshot: ResourceCatalogSnapshot }
  | { readonly kind: "UNCHANGED"; readonly snapshot: ResourceCatalogSnapshot }
  | { readonly kind: "CONFLICT"; readonly currentRevision: number };

export interface ResourceCatalogInstaller {
  install(input: InstallResourceCatalogInput): Promise<InstallResourceCatalogResult>;
}
