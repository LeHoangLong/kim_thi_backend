import { ProductCategory } from "../../model/ProductCategory";
import { IProductCategoryRepository } from "../../repository/IProductCategoryRepository";

export class MockProductCategoryRepository implements IProductCategoryRepository {
    async fetchAllCategories(limit: number, offset: number): Promise<ProductCategory[]> {
        let ret : ProductCategory[] = [];
        for (let i = offset; i < limit + offset; i++) {
            ret.push({ category: `cat_${i}`})
        }
        return ret
    }
    
    async createProductCategory(category: string): Promise<ProductCategory> {
        return { 
            category: category,
        }
    }

    async deleteProductCategory(category: string): Promise<number> {
        return 1;
    }

    async fetchProductCategoriesByProductId(productId: number): Promise<ProductCategory[]> {
        return [
            {
                category: 'cat_1',
            },
            { category: 'cat_2' },
        ]
    }

}