import { inject, injectable } from "inversify";
import { uuid } from "uuidv4";
import { UnrecognizedEnumValue } from "../exception/UnrecognizedEnumValue";
import { Image } from "../model/Image";
import { Product } from "../model/Product";
import { EProductUnit, ProductPrice } from "../model/ProductPrice";
import { IProductPriceRepository } from "../repository/IPriceRepository";
import { IProductRepository } from "../repository/IProductRepository";
import { TYPES } from "../types";
import { ImageWithPath, ProductImageController } from "./ImageController";

// We have a defaultPrice field to ensure that 1 and only 1 default price
// is given when creating a product
export interface CreateProductArgs {
    serialNumber: string,
    name: string,
    avatarId: string,
    defaultPrice: ProductPrice,
    alternativePrices: ProductPrice[],
    rank: number
}

export interface ProductSummary {
    product: Product,
    defaultPrice: ProductPrice,
    avatar: ImageWithPath,
}

export interface ProductWithPricesAndImages {
    product: Product,
    prices: ProductPrice[],
    avatar: ImageWithPath,
    images: ImageWithPath[],
}

@injectable()
export class ProductController {
    constructor(
        @inject(TYPES.PRODUCT_REPOSITORY) private productRepository: IProductRepository,
        @inject(TYPES.PRODUCT_PRICE_REPOSITORY) private productPriceRepository: IProductPriceRepository,
        @inject(TYPES.PRODUCT_IMAGE_CONTROLLER) private productImageController: ProductImageController,
    ){}

    async createProduct(args: CreateProductArgs) : Promise<ProductWithPricesAndImages> {
        let serialNumber : string = args.serialNumber
        if (serialNumber === "") {
            serialNumber = uuid()
        }
        let product : Product = {
            id: null,
            serialNumber: serialNumber,
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
        let avatar = await this.productImageController.fetchImageWithPath(product.avatarId)
        return {
            product: product,
            prices: productPrices,
            images: [],
            avatar: avatar,
        }
    }

    async fetchProductSummaries(offset: number, limit: number) : Promise<ProductSummary[]> {
        let products = await this.productRepository.fetchProducts(offset, limit);
        let ret : ProductSummary[] = [];
        for (let i = 0; i < products.length; i++) {
            let product = products[i];
            let defaultPrice = await this.productPriceRepository.fetchDefaultPriceByProductId(product.id!);
            let avatar = await this.productImageController.fetchImageWithPath(product.avatarId)
            let summary : ProductSummary = {
                product,
                defaultPrice,
                avatar
            }
            ret.push(summary)
        }
        return ret;
    }

    async fetchProductDetailById(id: number) : Promise<ProductWithPricesAndImages> {
        let product = await this.productRepository.fetchProductById(id)
        let avatarWithImage = await this.productImageController.fetchImageWithPath(product.avatarId)
        let productPrices = await this.productPriceRepository.fetchPricesByProductId(product.id!);
        return {
            product: product,
            prices: productPrices,
            avatar: avatarWithImage,
            images: [],
        }
    }

    async fetchNumberOfProducts() : Promise<number> {
        return this.productRepository.fetchNumberOfProducts();
    }

    async updateProduct(id: number, args: CreateProductArgs) : Promise<ProductWithPricesAndImages> {
        console.log('1.1')
        await this.productRepository.deleteProduct(id)
        console.log('1.2')
        let prices = await this.productPriceRepository.fetchPricesByProductId(id)
        console.log('1.3')
        for (let i = 0; i < prices.length; i++) {
            await this.productPriceRepository.deletePrice(prices[i].id!)
        }
        console.log('1.4')
        return this.createProduct(args)
    }
}