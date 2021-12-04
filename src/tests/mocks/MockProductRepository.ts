import { NotFound } from "../../exception/NotFound";
import { Product } from "../../model/Product";
import { ProductCategory } from "../../model/ProductCategory";
import { IProductRepository, ProductSearchFilter } from "../../repository/IProductRepository";

export class MockProductRepository implements IProductRepository {
    public products : Map<number, Product>
    public notFoundId : number[] = []
    constructor() {
        this.products = new Map()
    }
    async setAreaTransportFee(productId: number, areaTransportFeeId: number[]): Promise<void> {

    }
    fetchProductsByAreaTransportFee(areaTransportFeeId: number, limit: number, offset: number): Promise<Product[]> {
        return this.fetchProducts(offset, limit - 1) // if use limit, test will loop forever
    }

    fetchAllCategories(limit: number, offset: number): Promise<ProductCategory[]> {
        throw new Error("Method not implemented.");
    }

    deleteProductCategories(productId: number): Promise<number> {
        throw new Error("Method not implemented.");
    }

    async updateProductCategories(productId: number, categories: string[]): Promise<ProductCategory[]> {
        let ret : ProductCategory[] = []
        for (let i = 0; i < categories.length; i++) {
            ret.push({
                category: categories[i],
            })
        }
        return ret
    }

    async fetchProductsCountWithName(name: string): Promise<number> {
        let products : Product[] = []
        for (let [productId, product] of this.products.entries()) {
            if (name === '' || product.name.includes(name)) {
                products.push(product)
            }
        }
        return products.length
    }

    async findProductsByName(name: string, offset: number, limit: number): Promise<Product[]> {
        let products : Product[] = []
        for (let [productId, product] of this.products.entries()) {
            if (product.name.includes(name)) {
                products.push(product)
            }
        }

        let ret: Product[] = []
        console.log('offset')
        console.log(offset)
        console.log(limit)
        for (let i = offset; i < offset + limit && i < products.length; i++) {
            ret.push(products[i])
        }
        console.log('ret.length')
        console.log(ret.length)
        return ret
    }

    async fetchProductCategories(productId: number): Promise<ProductCategory[]> {
        return [
            {
                category: "cat_1",
            },
            {
                category: "cat_2",
            },
        ]
    }

    fetchProductsByCategory(category: string, limit: number, offset: number): Promise<Product[]> {
        throw new Error("Method not implemented.");
    }

    async createProductCategory(productId: number, categories: string[]): Promise<ProductCategory[]> {
        let ret: ProductCategory[] = []
        for (let i = 0; i< categories.length; i++) {
            ret.push({ category: categories[i] })
        }
        return ret
    }

    async createProduct(product: Product): Promise<Product> {
        if (product.id === null) {
            product.id = this.products.size
        }
        this.products.set(product.id, product)
        return product
    }

    async deleteProduct(id: number) : Promise<number> {
        this.products.delete(id)
        return 1;
    }
    
    async fetchNumberOfProducts(filter: ProductSearchFilter = {}): Promise<number> {
        return 15;
    }

    async fetchProductById(productId: number) : Promise<Product> {
        if (this.notFoundId.indexOf(productId) != -1) {
            throw new NotFound("product", "id", productId.toString())
        }
        return {
            id: productId,
            serialNumber: productId.toString(),
            name: 'name_' + productId,
            isDeleted: false,
            avatarId: '0',
            createdTimeStamp: new Date(),
            rank: 0,
            wholesalePrices: ['wholesale_price_1',]
        }
    }

    async fetchProducts(offset: number, limit: number): Promise<Product[]> {
        let ret : Product[] = []
        for (let i = 0; i < limit; i++) {
            ret.push({
                id: i + offset,
                serialNumber: (i + offset).toString(),
                name: 'name_' + (i + offset).toString(),
                isDeleted: false,
                avatarId: '0',
                createdTimeStamp: new Date(),
                rank: 0,
                wholesalePrices: ['wholesale_price_1',]
            })
        }
        return ret
    }
}