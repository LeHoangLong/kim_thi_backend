import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express, { CookieOptions } from 'express';
import { ProductImageController } from '../controller/ImageController';
import { ProductController } from '../controller/ProductController';
import config from '../../config.json';

@injectable()
export class ProductView {
    constructor(
        @inject(TYPES.PRODUCT_IMAGE_CONTROLLER) private imageController : ProductImageController,
        @inject(TYPES.PRODUCT_CONTROLLER) private productController: ProductController,
    ) {}

    async fetchProducts(request: express.Request, response: express.Response) {
        let limit = request.body.limit;
        let offset = request.body.offset;
        if (limit === undefined) {
            limit = config.pagination.defaultSize;
        }
        if (offset === undefined) {
            offset = 0;
        }

        let products = await this.productController.fetchProducts(offset, limit);
        let ret = []
        for (let i = 0; i < products.length; i++) {
            let image = await this.imageController.fetchImageWithPath(products[i].product.avatarId);
            let productsWithImages = {
                ...products[i],
                image: image,
            };
            ret.push(productsWithImages);
        }
        return response.status(200).send(ret);
    }

    async fetchProductsCount(request: express.Request, response: express.Response) {
        let numberOfProducts = await this.productController.fetchNumberOfProducts()
        response.status(200).send(numberOfProducts)
    }

}