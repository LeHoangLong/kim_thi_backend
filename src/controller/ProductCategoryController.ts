import { inject, injectable } from "inversify";
import { ProductCategory } from "../model/ProductCategory";
import { IProductCategoryRepository } from "../repository/IProductCategoryRepository";
import { TYPES } from "../types";

@injectable()
export class ProductCategoryController {
    constructor(
        @inject(TYPES.PRODUCT_CATEGORY_REPOSITORY) private categoryRepository: IProductCategoryRepository,
    ) {}

    fetchCategories(limit: number, offset: number) : Promise<ProductCategory[]> {
        return this.categoryRepository.fetchAllCategories(limit, offset)
    }

    deleteCategory(category: string) : Promise<number> {
        return this.categoryRepository.deleteProductCategory(category)
    }

    createCategory(category: string) : Promise<ProductCategory> {
        return this.categoryRepository.createProductCategory(category)
    }

    getNumberOfCategories() : Promise<number> {
        return this.categoryRepository.fetchNumberOfCategories()
    } 
}