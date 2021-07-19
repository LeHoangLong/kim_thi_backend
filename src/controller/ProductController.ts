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

    async _productsToProductSummaries(products: Product[]) : Promise<ProductSummary[]> {
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

    async fetchProductSummaries(offset: number, limit: number) : Promise<ProductSummary[]> {
        let products = await this.productRepository.fetchProducts(offset, limit);
        return this._productsToProductSummaries(products);
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
        await this.productRepository.deleteProduct(id)
        let prices = await this.productPriceRepository.fetchPricesByProductId(id)
        for (let i = 0; i < prices.length; i++) {
            await this.productPriceRepository.deletePrice(prices[i].id!)
        }
        return this.createProduct(args)
    }

    async findProductsByName(name: string, offset: number, limit: number) : Promise<[number, ProductSummary[]]> {
        let count = await this.productRepository.fetchProductsCountWithName(name);
        console.log('count')
        console.log(count)
        let products = await this.productRepository.findProductsByName(name, offset, limit)
        let productSummaries = await this._productsToProductSummaries(products)
        return [count, productSummaries];
    }
}