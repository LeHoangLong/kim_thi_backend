import { uuid } from "uuidv4";
import { Product } from "../../src/model/Product";
import { ProductPrice } from "../../src/model/ProductPrice";
import { IProductRepository } from "../../src/repository/IProductRepository";

export class MockProductRepository implements IProductRepository {
    public products : Map<string, Product>
    public prices : Map<string, ProductPrice[]>
    constructor() {
        this.products = new Map()
        this.prices = new Map()
    }

    async createProduct(product: Product, pricesToCreate: ProductPrice[]): Promise<Product> {
        if (product.id === null) {
            product.id = this.products.size.toString()
        }
        this.products.set(product.id, product)
        this.prices.set(product.id, pricesToCreate)
        return product
    }
    
    async fetchNumberOfProducts(): Promise<number> {
        return 15;
    }

    async fetchProducts(offset: number, limit: number): Promise<Product[]> {
        let ret : Product[] = []
        for (let i = 0; i < limit; i++) {
            ret.push({
                id: (i + offset).toString(),
                name: 'name_' + (i + offset).toString(),
                isDeleted: false,
                avatarId: '0',
                createdTimeStamp: new Date(),
                rank: 0,
            })
        }
        return ret
    }
}