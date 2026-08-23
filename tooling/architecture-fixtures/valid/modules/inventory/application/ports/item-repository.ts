import type { Item } from "../../domain/item.js";

export interface ItemRepository {
  findBySku(sku: string): Promise<Item | undefined>;
}
