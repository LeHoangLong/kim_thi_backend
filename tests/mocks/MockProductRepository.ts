import { Product } from "../../src/model/Product";
import { IProductRepository } from "../../src/repository/IProductRepository";

export const productRepository : IProductRepository = {
    createProduct(product: Product): Promise<Product> {
        throw "";
    },
    
    async fetchNumberOfProducts(): Promise<number> {
        return 15;
    },

    async fetchProducts(offset: number, limit: number): Promise<Product[]> {
        let ret : Product[] = []
        for (let i = 0; i < limit; i++) {
            ret.push({
                id: (i + offset).toString(),
                name: 'name_' + (i + offset).toString(),
                isDeleted: false,
                avatarId: '0',
                displayPriceId: i + offset,
                createdTimeStamp: new Date(),
                rank: 0,
            })
        }
        return ret
    },
}