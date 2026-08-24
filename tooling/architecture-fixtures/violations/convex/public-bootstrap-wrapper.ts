import { installCableCatalogV1 } from "../../../../apps/backend/convex/resourceCatalogBootstrap.js";

export const publicBootstrapWrapper = installCableCatalogV1;
export const missingCatalogErrorLiterals = ["INTERNAL"] as const;
