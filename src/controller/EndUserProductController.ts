import { inject, injectable } from 'inversify';
import { DeletedResource } from '../exception/DeletedResource';
import { Product } from '../model/Product'
import { ProductPrice } from '../model/ProductPrice';
import { IProductPriceRepository } from '../repository/IPriceRepository';
import { IProductRepository } from '../repository/IProductRepository';
import { TYPES } from '../types';

export interface ProductAndPrice {
    product: Product,
    price: ProductPrice,
}

@injectable()
export class EndUserProductController {
    constructor(
        @inject(TYPES.PRODUCT_REPOSITORY) private productRepository: IProductRepository,
        @inject(TYPES.PRODUCT_PRICE_REPOSITORY) private priceRepository: IProductPriceRepository,
    ) {}

    // throw DeletedResource if product is deleted
    async fetchProductAndPrice(productId: number) : Promise<ProductAndPrice> {
        let product = await this.productRepository.fetchProductById(productId, false)
        if (product.isDeleted) {
            throw new DeletedResource(`product with id ${product.id} has been deleted`)
        }
        let price = await this.priceRepository.fetchPriceById(product.id!)
        return {
            product: product,
            price: price,
        }
    }
}