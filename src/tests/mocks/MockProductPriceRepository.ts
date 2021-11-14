import Decimal from "decimal.js"
import { EProductUnit, PriceLevel, ProductPrice } from "../../model/ProductPrice"
import { IProductPriceRepository } from "../../repository/IPriceRepository"

export class MockProductPriceRepository implements IProductPriceRepository {
    constructor(
        public pricesByProductId : Map<number, ProductPrice[]> = new Map(),
    ) {}

    async fetchPricesByProductId(productId: number) : Promise<ProductPrice[]> {
        let ret : ProductPrice[] = []
        for (let i = 0 ; i < 2; i++) {
            ret.push(await this.fetchPriceById(i))
        }
        return ret
    }

    async fetchPriceById(id: number) : Promise<ProductPrice> {
        return {
            id: id,
            unit: EProductUnit.KG,
            isDeleted: false,
            defaultPrice: new Decimal('100'),
            priceLevels: [],
            isDefault: id == 0,
        }
    }

    async fetchDefaultPriceByProductId(producId: number) : Promise<ProductPrice> {
        return {
            id: 0,
            unit: EProductUnit.KG,
            isDeleted: false,
            defaultPrice: new Decimal('100'),
            priceLevels: [],
            isDefault: true,
        }
    }

    async deletePrice(id: number) : Promise<number> {
        return 1;
    }

    async createProductPrice(productId: number) : Promise<ProductPrice[]> {
        this.pricesByProductId.set(productId, [
            {
                id: 0,
                unit: EProductUnit.KG,
                isDeleted: false,
                defaultPrice: new Decimal('101'),
                priceLevels: [{
                    minQuantity: new Decimal(15),
                    price: new Decimal('50')
                }],
                isDefault: true,
            },{
                id: 1,
                unit: EProductUnit.KG,
                isDeleted: false,
                defaultPrice: new Decimal('102'),
                priceLevels: [{
                    minQuantity: new Decimal(15),
                    price: new Decimal('50')
                }],
                isDefault: false,
            },
        ])
        let ret = JSON.parse(JSON.stringify(this.pricesByProductId.get(productId)!))
        return ret
    }
}

