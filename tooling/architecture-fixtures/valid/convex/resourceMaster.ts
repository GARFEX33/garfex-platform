import type { ResourceContract } from "../resource-master/public.js";
import { adapter } from "../resource-master/infrastructure/adapter.js";

export const handler = (): ResourceContract => adapter();
