import { ProductPrice } from "../model/ProductPrice";

export interface IProductPriceRepository {
    createPrice(price: ProductPrice) : Promise<ProductPrice>
    fetchPriceById(productId: number) : Promise<ProductPrice>
}