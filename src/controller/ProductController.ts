import { inject, injectable } from "inversify";
import { v4 } from "uuid";
import { UnrecognizedEnumValue } from "../exception/UnrecognizedEnumValue";
import { Image } from "../model/Image";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { EProductUnit, ProductPrice } from "../model/ProductPrice";
import { IProductPriceRepository } from "../repository/IPriceRepository";
import { IProductCategoryRepository } from "../repository/IProductCategoryRepository";
import { IProductRepository } from "../repository/IProductRepository";
import { IConnectionFactory } from "../services/IConnectionFactory";
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
    rank: number,
    categories: string[]
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
    categories: ProductCategory[],
}

@injectable()
export class ProductController {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: IConnectionFactory,
        @inject(TYPES.PRODUCT_REPOSITORY) private productRepository: IProductRepository,
        @inject(TYPES.PRODUCT_PRICE_REPOSITORY) private productPriceRepository: IProductPriceRepository,
        @inject(TYPES.PRODUCT_IMAGE_CONTROLLER) private productImageController: ProductImageController,
        @inject(TYPES.PRODUCT_CATEGORY_REPOSITORY) private productCategoryRepository: IProductCategoryRepository,
    ){}

    async createProduct(args: CreateProductArgs) : Promise<ProductWithPricesAndImages> {
        let serialNumber : string = args.serialNumber
        if (serialNumber === "") {
            serialNumber = v4()
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
        
        let productPrices : ProductPrice[] = [];
        let categories : ProductCategory[] = [];
        await this.connectionFactory.startTransaction([
            this.productRepository,
            this.productPriceRepository
        ], async () => {
            product = await this.productRepository.createProduct(product);
            productPrices = await this.productPriceRepository.createProductPrice(product.id!, pricesToCreate)
            categories = await this.productRepository.fetchProductCategories(product.id!)
        })
        let avatar = await this.productImageController.fetchImageWithPath(product.avatarId)
        return {
            product: product,
            prices: productPrices,
            images: [],
            avatar: avatar,
            categories: categories,
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
        let categories = await this.productRepository.fetchProductCategories(product.id!)
        return {
            product: product,
            prices: productPrices,
            avatar: avatarWithImage,
            images: [],
            categories: categories,
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
        let products = await this.productRepository.findProductsByName(name, offset, limit)
        let productSummaries = await this._productsToProductSummaries(products)
        return [count, productSummaries];
    }

    async updateProductCategories(productId: number, categories: string[]) : Promise<ProductCategory[]>{
        await this.productRepository.fetchProductById(productId); // check if product id exists
        return this.productRepository.updateProductCategories(productId, categories)
    }
}