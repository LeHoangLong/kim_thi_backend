import { ProductCategory } from "../model/ProductCategory";

export interface IProductCategoryRepository {
    fetchAllCategories(limit: number, offset: number) : Promise<ProductCategory[]>;
    createProductCategory(category: string) : Promise<ProductCategory>
    deleteProductCategory(category: string) : Promise<number>;
    fetchProductCategoriesByProductId(productId: number) : Promise<ProductCategory[]>;
}