import "@garfex/typespec-semantic-manifest";
import "../valid-operations.tsp";

@externalContract("garfex.resource-master.external-client-contract", "1")
namespace Garfex.External.ResourceMaster;

model AuthorityRequest {
  actorId: string;
  role: string;
  capability: string;
  token: string;
}
