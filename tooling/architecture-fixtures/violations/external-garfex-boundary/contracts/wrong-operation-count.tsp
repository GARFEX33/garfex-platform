namespace Garfex.External.ResourceMaster;
@externalContract("garfex.resource-master.external-client-contract", "1")
interface Contract {
  getResource(): unknown;
}
