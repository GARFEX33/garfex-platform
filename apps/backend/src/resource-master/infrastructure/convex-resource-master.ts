import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { createResourceMaster } from "../application/resource-master.js";
import { ConvexResourceCatalogReader } from "./convex-resource-catalog.js";
import { ConvexResourceRepository, type ResourceDataModel } from "./convex-resource-repository.js";

export const createConvexQueryResourceMaster = (ctx: GenericQueryCtx<ResourceDataModel>) =>
  createResourceMaster({
    catalogReader: new ConvexResourceCatalogReader(ctx.db),
    repository: new ConvexResourceRepository(ctx.db),
  });

export const createConvexMutationResourceMaster = (ctx: GenericMutationCtx<ResourceDataModel>) =>
  createResourceMaster({
    catalogReader: new ConvexResourceCatalogReader(ctx.db),
    repository: new ConvexResourceRepository(ctx.db, ctx.db),
  });
