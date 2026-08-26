export const namedMappings = {
  getTaxonomy: "getTaxonomy",
  getEffectiveResourceSchema: "getEffectiveResourceSchema",
  getValidOptions: "getValidOptions",
  getNaturalUnits: "getNaturalUnits",
  getResource: "getResource",
  searchResources: "searchResources",
  describeResource: "describeResource",
  createResource: "createResource",
  updateNonIdentityData: "updateNonIdentityData",
  deactivateResource: "deactivateResource",
} as const;

export const finalAuthorization = "Resource Master performs final deny-by-default authorization";
