import type { FindItem } from "../../inventory/public.js";

export const makeDescribeStock =
  (findItem: FindItem) =>
  async (sku: string): Promise<string> => {
    const item = await findItem(sku);
    return item === undefined ? "missing" : item.sku;
  };
