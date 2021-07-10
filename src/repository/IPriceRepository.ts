import { ProductPrice } from "../model/ProductPrice";

export interface IProductPriceRepository {
    fetchPriceById(id: number) : Promise<ProductPrice>
    fetchPricesByProductId(productId: number) : Promise<ProductPrice[]>
    fetchDefaultPriceByProductId(productId: number) : Promise<ProductPrice>
    deletePrice(id: number) : Promise<number>
}