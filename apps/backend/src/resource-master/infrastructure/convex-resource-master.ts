import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { createResourceMaster } from "../application/resource-master.js";
import { StaticResourceCatalogReader } from "./static-resource-catalog-reader.js";
import { ConvexResourceRepository, type ResourceDataModel } from "./convex-resource-repository.js";

export const createConvexQueryResourceMaster = (ctx: GenericQueryCtx<ResourceDataModel>) =>
  createResourceMaster({
    catalogReader: new StaticResourceCatalogReader(),
    repository: new ConvexResourceRepository(ctx.db),
  });

export const createConvexMutationResourceMaster = (ctx: GenericMutationCtx<ResourceDataModel>) =>
  createResourceMaster({
    catalogReader: new StaticResourceCatalogReader(),
    repository: new ConvexResourceRepository(ctx.db, ctx.db),
  });
