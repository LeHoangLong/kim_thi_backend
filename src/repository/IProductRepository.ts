import { Product } from "../model/Product";
import { ProductPrice } from "../model/ProductPrice";

export interface IProductRepository {
    createProduct(product: Product, prices: ProductPrice[]): Promise<Product>;
    fetchNumberOfProducts(): Promise<number>;
    fetchProducts(offset: number, limit: number): Promise<Product[]>;
}