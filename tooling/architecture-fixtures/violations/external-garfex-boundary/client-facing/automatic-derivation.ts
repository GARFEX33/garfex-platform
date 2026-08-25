type ResourceMasterContract = { readonly getResource: unknown };

export type DerivedContract = Pick<ResourceMasterContract, "getResource">;
