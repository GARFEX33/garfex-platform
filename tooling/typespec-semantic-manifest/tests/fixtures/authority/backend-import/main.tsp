import "@garfex/typespec-semantic-manifest";
import "../valid-operations.tsp";
import "./backend-models.tsp";

@externalContract("garfex.resource-master.external-client-contract", "1")
namespace Garfex.External.ResourceMaster;
