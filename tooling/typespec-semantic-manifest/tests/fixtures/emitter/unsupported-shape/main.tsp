import "@garfex/typespec-semantic-manifest";
import "../../../../../../contracts/external-garfex/resource-master/models.tsp";
import "../../../../../../contracts/external-garfex/resource-master/failures.tsp";
import "./operations.tsp";

@externalContract("garfex.resource-master.external-client-contract", "1")
namespace Garfex.External.ResourceMaster;
