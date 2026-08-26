import "@garfex/typespec-semantic-manifest";
import "../valid-operations.tsp";

@externalContract("garfex.resource-master.external-client-contract", "1")
namespace Garfex.External.ResourceMaster;

op extraOperation(request: FixtureRequest): FixtureOutcome;
