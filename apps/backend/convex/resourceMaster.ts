import { mutation, query } from "./_generated/server.js";
import {
  createResourceMasterContract,
  createResourceMasterReturns,
} from "./resourceMasterContract.generated.js";
import {
  createConvexMutationResourceMaster,
  createConvexQueryResourceMaster,
} from "../src/resource-master/infrastructure/convex-resource-master.js";
import { createConfiguredAuthenticationComposition } from "../src/auth/composition.js";
import type { TrustedActorResolver } from "../src/external-garfex-boundary/trusted/identity.js";
import {
  invokeExternalCreateResource,
  invokeExternalDeactivateResource,
  invokeExternalUpdateNonIdentityData,
  invokeExternalGetEffectiveResourceSchema,
  invokeExternalGetNaturalUnits,
  invokeExternalGetResource,
  invokeExternalGetTaxonomy,
  invokeExternalGetValidOptions,
  invokeExternalSearchResources,
  invokeExternalDescribeResource,
} from "../src/external-garfex-boundary/composition.js";

const authenticationComposition = () =>
  createConfiguredAuthenticationComposition({
    runtimeEnvironment: process.env.GARFEX_RUNTIME_ENV,
    authMode: process.env.GARFEX_AUTH_MODE,
  });

const resolver = (): TrustedActorResolver => ({
  resolveActor: async () => {
    const composition = authenticationComposition();
    if (composition === null) return null;
    const actorId = await composition.identityAdapter.resolveActorId();
    return actorId === null ? null : { actorId, capabilities: new Set(composition.capabilities) };
  },
});

export const getTaxonomy = query({
  args: {},
  returns: createResourceMasterReturns.getTaxonomy,
  handler: async (ctx, args) =>
    invokeExternalGetTaxonomy(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexQueryResourceMaster(ctx),
    }),
});

export const getEffectiveResourceSchema = query({
  args: createResourceMasterContract.getEffectiveResourceSchema,
  returns: createResourceMasterReturns.getEffectiveResourceSchema,
  handler: async (ctx, args) =>
    invokeExternalGetEffectiveResourceSchema(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexQueryResourceMaster(ctx),
    }),
});

export const getValidOptions = query({
  args: createResourceMasterContract.getValidOptions,
  returns: createResourceMasterReturns.getValidOptions,
  handler: async (ctx, args) =>
    invokeExternalGetValidOptions(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexQueryResourceMaster(ctx),
    }),
});

export const getNaturalUnits = query({
  args: createResourceMasterContract.getNaturalUnits,
  returns: createResourceMasterReturns.getNaturalUnits,
  handler: async (ctx, args) =>
    invokeExternalGetNaturalUnits(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexQueryResourceMaster(ctx),
    }),
});

export const getResource = query({
  args: createResourceMasterContract.getResource,
  returns: createResourceMasterReturns.getResource,
  handler: async (ctx, args) =>
    invokeExternalGetResource(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexQueryResourceMaster(ctx),
    }),
});

export const searchResources = query({
  args: createResourceMasterContract.searchResources,
  returns: createResourceMasterReturns.searchResources,
  handler: async (ctx, args) =>
    invokeExternalSearchResources(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexQueryResourceMaster(ctx),
    }),
});

export const describeResource = query({
  args: createResourceMasterContract.describeResource,
  returns: createResourceMasterReturns.describeResource,
  handler: async (ctx, args) =>
    invokeExternalDescribeResource(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexQueryResourceMaster(ctx),
    }),
});

export const createResource = mutation({
  args: createResourceMasterContract.createResource,
  returns: createResourceMasterReturns.createResource,
  handler: async (ctx, args) =>
    invokeExternalCreateResource(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexMutationResourceMaster(ctx),
    }),
});

export const updateNonIdentityData = mutation({
  args: createResourceMasterContract.updateNonIdentityData,
  returns: createResourceMasterReturns.updateNonIdentityData,
  handler: async (ctx, args) =>
    invokeExternalUpdateNonIdentityData(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexMutationResourceMaster(ctx),
    }),
});

export const deactivateResource = mutation({
  args: createResourceMasterContract.deactivateResource,
  returns: createResourceMasterReturns.deactivateResource,
  handler: async (ctx, args) =>
    invokeExternalDeactivateResource(args, {
      actorResolver: resolver(),
      resourceMaster: createConvexMutationResourceMaster(ctx),
    }),
});
