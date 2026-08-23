import type { FindItem } from "../../modules/inventory/public.js";

export const describeStockWorkflow = async (findItem: FindItem, sku: string): Promise<boolean> =>
  (await findItem(sku)) !== undefined;
