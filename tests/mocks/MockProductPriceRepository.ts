import { EProductUnit, ProductPrice } from "../../src/model/ProductPrice"
import { IProductPriceRepository } from "../../src/repository/IPriceRepository"

export const iProductPriceRepository : IProductPriceRepository = {
    createPrice(price: ProductPrice) : Promise<ProductPrice> {
        throw ""
    },
    async fetchPriceById(id: number) : Promise<ProductPrice> {
        return {
            id: id,
            unit: EProductUnit.KG,
            minQuantity: 0,
            price: 100,
            isDeleted: false,
        }
    },
}

