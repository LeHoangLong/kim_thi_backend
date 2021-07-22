import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { ProductPrice } from "../model/ProductPrice";

export interface IProductRepository {
    createProduct(product: Product): Promise<Product>;
    fetchNumberOfProducts(): Promise<number>;
    fetchProducts(offset: number, limit: number): Promise<Product[]>;
    fetchProductById(id: number) : Promise<Product>;
    deleteProduct(pk: number) : Promise<number>;
    fetchProductsCountWithName(name: string) : Promise<number>;
    findProductsByName(name: string, offset: number, limit: number) : Promise<Product[]>;
    fetchProductsByCategory(category: string, limit: number, offset: number) : Promise<Product[]>;
    updateProductCategories(productId: number, categories: string[]) : Promise<ProductCategory[]>;
}