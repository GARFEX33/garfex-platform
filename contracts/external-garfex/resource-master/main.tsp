import "@typespec/compiler";
import "@garfex/typespec-semantic-manifest";
import "./contract-metadata.tsp";
import "./models.tsp";
import "./failures.tsp";
import "./operations.tsp";

@externalContract("garfex.resource-master.external-client-contract", "1")
namespace Garfex.External.ResourceMaster;
