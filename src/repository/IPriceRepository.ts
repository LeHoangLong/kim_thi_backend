import { ProductPrice } from "../model/ProductPrice";

export interface IProductPriceRepository {
    fetchPriceById(id: number) : Promise<ProductPrice>
    fetchPricesByProductId(productId: string) : Promise<ProductPrice[]>
}