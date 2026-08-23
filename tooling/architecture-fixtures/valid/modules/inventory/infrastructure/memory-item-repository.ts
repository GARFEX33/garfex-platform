import type { ItemRepository } from "../application/ports/item-repository.js";
import type { Item } from "../domain/item.js";

export const memoryItemRepository: ItemRepository = {
  async findBySku(sku): Promise<Item | undefined> {
    return { sku };
  },
};
