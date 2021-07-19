import { Product } from "../model/Product";
import { ProductPrice } from "../model/ProductPrice";

export interface IProductRepository {
    createProduct(product: Product, prices: ProductPrice[]): Promise<Product>;
    fetchNumberOfProducts(): Promise<number>;
    fetchProducts(offset: number, limit: number): Promise<Product[]>;
    fetchProductById(id: number) : Promise<Product>;
    deleteProduct(pk: number) : Promise<number>;
    fetchProductsCountWithName(name: string) : Promise<number>;
    findProductsByName(name: string, offset: number, limit: number) : Promise<Product[]>;
}