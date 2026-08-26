namespace Garfex.External.ResourceMaster;

@externalContract("garfex.resource-master.external-client-contract", "1")
interface Contract {
  getTaxonomy(): unknown;
  getEffectiveResourceSchema(): unknown;
  getValidOptions(): unknown;
  getNaturalUnits(): unknown;
  getResource(): unknown;
  searchResources(): unknown;
  describeResource(): unknown;
  createResource(): unknown;
  updateNonIdentityData(): unknown;
  deactivateResource(): unknown;
}
