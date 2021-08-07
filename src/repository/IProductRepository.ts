import { AreaTransportFee } from "../model/AreaTransportFee";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { ProductPrice } from "../model/ProductPrice";

export interface ProductSearchFilter {
    category?: string,
    name?: string,
}

export interface IProductRepository {
    createProduct(product: Product): Promise<Product>;
    fetchNumberOfProducts(filter?: ProductSearchFilter): Promise<number>;
    fetchProducts(offset: number, limit: number): Promise<Product[]>;
    fetchProductById(id: number) : Promise<Product>;
    deleteProduct(pk: number) : Promise<number>;
    fetchProductsCountWithName(name: string) : Promise<number>;
    findProductsByName(name: string, offset: number, limit: number) : Promise<Product[]>;
    fetchProductsByCategory(category: string, limit: number, offset: number, name?: string) : Promise<Product[]>;
    updateProductCategories(productId: number, categories: string[]) : Promise<ProductCategory[]>;
    fetchProductCategories(productId: number) : Promise<ProductCategory[]>;
    createProductCategory(productId: number, categories: string[]) : Promise<ProductCategory[]>;
    fetchProductsByAreaTransportFee(areaTransportFeeId: number, limit: number, offset: number) : Promise<Product[]>;
}