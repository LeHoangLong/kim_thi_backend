import { Product } from "../model/Product";

export interface IProductRepository {
    createProduct(product: Product): Promise<Product>;
    fetchNumberOfProducts(): Promise<number>;
    fetchProducts(offset: number, limit: number): Promise<Product[]>;
}