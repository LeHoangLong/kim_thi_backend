import { inject, injectable } from "inversify";
import { UnrecognizedEnumValue } from "../exception/UnrecognizedEnumValue";
import { Product } from "../model/Product";
import { EProductUnit, ProductPrice } from "../model/ProductPrice";
import { IProductPriceRepository } from "../repository/IPriceRepository";
import { IProductRepository } from "../repository/IProductRepository";
import { TYPES } from "../types";
import { ProductImageController } from "./ImageController";

// We have a defaultPrice field to ensure that 1 and only 1 default price
// is given when creating a product
export interface CreateProductArgs {
    id?: string,
    name: string,
    avatarId: string,
    defaultPrice: ProductPrice,
    alternativePrices: ProductPrice[],
    rank: number
}

export interface ProductWithPrices {
    product: Product,
    prices: ProductPrice[],
}

@injectable()
export class ProductController {
    constructor(
        @inject(TYPES.PRODUCT_REPOSITORY) private productRepository: IProductRepository,
        @inject(TYPES.PRODUCT_PRICE_REPOSITORY) private productPriceRepository: IProductPriceRepository,
    ){}

    async createProduct(args: CreateProductArgs) : Promise<ProductWithPrices> {
        let product : Product = {
            id: null,
            name: args.name,
            isDeleted: false,
            avatarId: args.avatarId,
            createdTimeStamp: new Date(),
            rank: args.rank,
        }

        let pricesToCreate = args.alternativePrices
        args.defaultPrice.isDefault = true
        pricesToCreate.forEach(e => e.isDefault = false)
        pricesToCreate.push(args.defaultPrice)
        
        product = await this.productRepository.createProduct(product, pricesToCreate); 
        let productPrices = await this.productPriceRepository.fetchPricesByProductId(product.id!);
        return {
            product: product,
            prices: productPrices,
        }
    }

    async fetchProducts(offset: number, limit: number) : Promise<ProductWithPrices[]> {
        let products = await this.productRepository.fetchProducts(offset, limit);
        let ret : ProductWithPrices[] = [];
        for (let i = 0; i < products.length; i++) {
            let product = products[i];
            let productPrices = await this.productPriceRepository.fetchPricesByProductId(product.id!);
            ret.push({
                product: product,
                prices: productPrices
            })
        }
        return ret;
    }

    async fetchNumberOfProducts() : Promise<number> {
        return this.productRepository.fetchNumberOfProducts();
    }
}