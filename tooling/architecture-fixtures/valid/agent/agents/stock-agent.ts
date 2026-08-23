import { decide, type Decision } from "../core/decision.js";
import type { FindItem } from "../../modules/inventory/public.js";

export const runStockAgent = async (findItem: FindItem, sku: string): Promise<Decision> =>
  decide((await findItem(sku)) !== undefined);
