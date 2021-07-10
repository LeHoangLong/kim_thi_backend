import { EProductUnit, PriceLevel, ProductPrice } from "../../src/model/ProductPrice"
import { IProductPriceRepository } from "../../src/repository/IPriceRepository"

export const iProductPriceRepository : IProductPriceRepository = {
    async fetchPricesByProductId(productId: number) : Promise<ProductPrice[]> {
        let ret : ProductPrice[] = []
        for (let i = 0 ; i < 2; i++) {
            ret.push(await this.fetchPriceById(i))
        }
        return ret
    },
    async fetchPriceById(id: number) : Promise<ProductPrice> {
        return {
            id: id,
            unit: EProductUnit.KG,
            isDeleted: false,
            defaultPrice: 100,
            priceLevels: [],
            isDefault: id == 0,
        }
    },

    async fetchDefaultPriceByProductId(producId: number) : Promise<ProductPrice> {
        return {
            id: 0,
            unit: EProductUnit.KG,
            isDeleted: false,
            defaultPrice: 100,
            priceLevels: [],
            isDefault: true,
        }
    },

    async deletePrice(id: number) : Promise<number> {
        return 1;
    },
}

