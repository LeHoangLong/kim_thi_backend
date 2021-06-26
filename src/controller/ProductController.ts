import { inject, injectable } from "inversify";
import { UnrecognizedEnumValue } from "../exception/UnrecognizedEnumValue";
import { Product } from "../model/Product";
import { EProductUnit, ProductPrice } from "../model/ProductPrice";
import { IProductPriceRepository } from "../repository/IPriceRepository";
import { IProductRepository } from "../repository/IProductRepository";
import { TYPES } from "../types";
import { ProductImageController } from "./ImageController";

export interface CreateProductArgs {
    id?: string,
    name: string,
    avatarId: string,
    unit: string,
    price: number,
    minQuantity: number,
    rank: number
}

export interface ProductWithDisplayPrice {
    product: Product,
    displayPrice: ProductPrice,
}

@injectable()
export class ProductController {
    constructor(
        @inject(TYPES.PRODUCT_REPOSITORY) private productRepository: IProductRepository,
        @inject(TYPES.PRODUCT_PRICE_REPOSITORY) private productPriceRepository: IProductPriceRepository,
    ){}

    async createProduct(args: CreateProductArgs) : Promise<Product> {
        let unit: EProductUnit;
        switch (args.unit) {
            case "KG":
                unit = EProductUnit.KG
                break;
            default:
                throw new UnrecognizedEnumValue(args.unit);
        }
        let displayPrice : ProductPrice = {
            id: null,
            unit: unit,
            minQuantity: args.minQuantity,
            price: args.price,
            isDeleted: false,
        };
        displayPrice = await this.productPriceRepository.createPrice(displayPrice);
        if (displayPrice.id === null) {
            throw "Could not create price"
        } else {
            let product : Product = {
                id: null,
                name: args.name,
                isDeleted: false,
                avatarId: args.avatarId,
                displayPriceId: displayPrice.id,
                createdTimeStamp: new Date(),
                rank: args.rank,
            }
            product = await this.productRepository.createProduct(product); 
            return product          
        }
    }

    async fetchProducts(offset: number, limit: number) : Promise<ProductWithDisplayPrice[]> {
        let products = await this.productRepository.fetchProducts(offset, limit);
        let ret : ProductWithDisplayPrice[] = [];
        for (let i = 0; i < products.length; i++) {
            let product = products[i];
            let productPrice = await this.productPriceRepository.fetchPriceById(product.displayPriceId);
            ret.push({
                product: product,
                displayPrice: productPrice,
            })
        }
        return ret;
    }

    async fetchNumberOfProducts() : Promise<number> {
        return this.productRepository.fetchNumberOfProducts();
    }
}