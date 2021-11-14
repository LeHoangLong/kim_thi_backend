import { inject, injectable } from "inversify";
import { v4 } from "uuid";
import { AreaTransportFee } from "../model/AreaTransportFee";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { ProductPrice } from "../model/ProductPrice";
import { IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository";
import { IProductPriceRepository } from "../repository/IPriceRepository";
import { IProductRepository, ProductSearchFilter } from "../repository/IProductRepository";
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
    categories: ProductCategory[],
    wholesalePrices: string[],
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
        @inject(TYPES.AREA_TRANSPORT_FEE_REPOSITORY) private areaTransportFeeRepository: IAreaTransportFeeRepository,
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
            wholesalePrices: args.wholesalePrices,
        }

        let pricesToCreate = args.alternativePrices
        args.defaultPrice.isDefault = true
        pricesToCreate.forEach(e => e.isDefault = false)
        pricesToCreate.push(args.defaultPrice)

        let productPrices : ProductPrice[] = [];
        let categories : ProductCategory[] = [];
        let areaTransportFees : AreaTransportFee[] = []
        await this.connectionFactory.startTransaction(this, [
            this.productRepository,
            this.productPriceRepository
        ], async () => {
            product = await this.productRepository.createProduct(product);
            productPrices = await this.productPriceRepository.createProductPrice(product.id!, pricesToCreate)

            let categoryStr : string[] = []
            for (let i = 0; i < args.categories.length; i++) {
                categoryStr.push(args.categories[i].category)
            }
            categories = await this.productRepository.createProductCategory(product.id!, categoryStr)
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

    async deleteProduct(productId: number) : Promise<number> {
        return this.productRepository.deleteProduct(productId)
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

    async fetchProductsByCategory(category: string, offset: number, limit: number, name?: string) : Promise<ProductSummary[]> {
        let products = await this.productRepository.fetchProductsByCategory(category, limit, offset, name);
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

    async fetchNumberOfProducts(filter: ProductSearchFilter = {}) : Promise<number> {
        return this.productRepository.fetchNumberOfProducts(filter);
    }

    async updateProduct(id: number, args: CreateProductArgs) : Promise<ProductWithPricesAndImages> {
        let currentProduct = await this.productRepository.fetchProductById(id)
        let prices = await this.productPriceRepository.fetchPricesByProductId(id)
        let createdProduct : ProductWithPricesAndImages | null = null
        if (this.shouldUpdateProduct(currentProduct, args) ||
         this.shouldUpdatePrice(prices, args)) {
            await this.connectionFactory.startTransaction(this, [this.productRepository, this.productPriceRepository], async () => {
                await this.productRepository.deleteProduct(id)
                // shouldn't need to do this as price is associated to immutable product
                // TODO: remove in the future
                for (let i = 0; i < prices.length; i++) {
                    await this.productPriceRepository.deletePrice(prices[i].id!)
                }
                createdProduct = await this.createProduct(args)
            })
        }

        let currentProductCategories : ProductCategory[] = await this.productRepository.fetchProductCategories(id)
        if (this.shouldUpdateProductCategories(currentProductCategories, args)) {
            let categoryStr: string[] = []
            for (let  i = 0; i < args.categories.length; i++) {
                categoryStr.push(args.categories[i].category)
            }
            let categories = await this.productRepository.updateProductCategories(id, categoryStr)
            if (createdProduct !== null) {
                (createdProduct as ProductWithPricesAndImages).categories = categories
            }
        }

        if (createdProduct !== null) {
            return createdProduct
        } else {
            return this.fetchProductDetailById(id)
        }
    }

    private shouldUpdateProduct(currentProductDetail: Product, args: CreateProductArgs) : boolean {
        let wholesalePricesDifferent = false
        if (currentProductDetail.wholesalePrices.length !== args.wholesalePrices.length) {
            wholesalePricesDifferent = true
        } else {
            for (let i = 0; i < currentProductDetail.wholesalePrices.length; i++) {
                if (args.wholesalePrices.indexOf(currentProductDetail.wholesalePrices[i]) === -1) {
                    wholesalePricesDifferent = true
                    break
                }
            }
        }

        if (currentProductDetail.name !== args.name ||
             currentProductDetail.serialNumber !== args.serialNumber ||
             currentProductDetail.avatarId !== args.avatarId ||
             currentProductDetail.rank !== args.rank ||
             wholesalePricesDifferent
        ) {
            return true
        }
        return false
    }

    private shouldUpdatePrice(currentProductPrices: ProductPrice[], args: CreateProductArgs) : boolean {
        if (currentProductPrices.length !== args.alternativePrices.length + 1) {
            return true
        } else {
            if (currentProductPrices.findIndex(e => e.id === args.defaultPrice.id)) {
                return true
            }
            for (let i = 0; i < args.alternativePrices.length; i++) {
                if (currentProductPrices.findIndex(e => e.id !== args.alternativePrices[i].id) === -1){
                    return true
                }
            }
        }
        return false
    }

    private shouldUpdateProductCategories(currentProductCategories: ProductCategory[], args: CreateProductArgs) : boolean {
        if (currentProductCategories.length !== args.categories.length) {
            return true
        } else {
            for (let i = 0; i < currentProductCategories.length; i++) {
                if (args.categories.findIndex(e => e.category === currentProductCategories[i].category) === -1) {
                    return true
                }
            }
        }
        return false
    }

    async findProductsByName(name: string, offset: number, limit: number) : Promise<[number, ProductSummary[]]> {
        let count = await this.productRepository.fetchProductsCountWithName(name);
        let products = await this.productRepository.findProductsByName(name, offset, limit)
        let productSummaries = await this._productsToProductSummaries(products)
        return [count, productSummaries];
    }
}
