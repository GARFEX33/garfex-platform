import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { createResourceMaster } from "../application/resource-master.js";
import { cableCatalog } from "./cable-catalog.js";
import { ConvexResourceRepository, type ResourceDataModel } from "./convex-resource-repository.js";

export const createConvexQueryResourceMaster = (ctx: GenericQueryCtx<ResourceDataModel>) =>
  createResourceMaster({
    catalog: cableCatalog,
    repository: new ConvexResourceRepository(ctx.db),
  });

export const createConvexMutationResourceMaster = (ctx: GenericMutationCtx<ResourceDataModel>) =>
  createResourceMaster({
    catalog: cableCatalog,
    repository: new ConvexResourceRepository(ctx.db, ctx.db),
  });
