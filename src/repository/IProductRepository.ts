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

    fetchProductById(id: number, ignoreDeleted?: boolean) : Promise<Product>;
    deleteProduct(pk: number) : Promise<number>;

    fetchProductsCountWithName(name: string, category?: string) : Promise<number>;
    
    updateProductCategories(productId: number, categories: string[]) : Promise<ProductCategory[]>;
    fetchProductCategories(productId: number) : Promise<ProductCategory[]>;
    createProductCategory(productId: number, categories: string[]) : Promise<ProductCategory[]>;

    fetchProducts(filter: ProductSearchFilter & {
        limit: number, 
        offset: number
    }) : Promise<Product[]>
}