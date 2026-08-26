import "@garfex/typespec-semantic-manifest";
import "../../authority/valid-operations.tsp";

@externalContract("garfex.resource-master.external-client-contract", "1")
namespace Garfex.External.ResourceMaster;

op getTaxonomy(request: FixtureRequest): FixtureOutcome;
