import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express, { CookieOptions } from 'express';
import { ProductImageController } from '../controller/ImageController';
import { ProductController } from '../controller/ProductController';
import config from '../../config.json';
import { UnrecognizedEnumValue } from '../exception/UnrecognizedEnumValue';
import { EProductUnit, EProductUnitToString, ProductPrice, stringToEProductUnit } from '../model/ProductPrice';

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
            products[i].prices.forEach((e) => {
                let unitStr = EProductUnitToString(e.unit)
                e.unit = unitStr as any
            })
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

    async createProduct(request: express.Request, response: express.Response) {
        try {
            let defaultPrice = {
                ...request.body.defaultPrice,
                unit: stringToEProductUnit(request.body.defaultPrice.unit)
            }

            let alternativePrices : ProductPrice[] = []
            for (let i = 0; i < request.body.alternativePrices.length; i++) {
                alternativePrices.push({
                    ...request.body.alternativePrices[i],
                    unit: stringToEProductUnit(request.body.defaultPrice.unit)
                })
            }
            let productWithPrices = await this.productController.createProduct({
                id: request.body.id,
                name: request.body.name,
                avatarId: request.body.avatarId,
                defaultPrice: defaultPrice,
                alternativePrices: alternativePrices,
                rank: request.body.rank
            })

            productWithPrices.prices.forEach((e) => {
                let unitStr = EProductUnitToString(e.unit)
                e.unit = unitStr as any
            })
            return response.status(201).send(productWithPrices)
        } catch (exception) {
            if (exception instanceof UnrecognizedEnumValue) {
                return response.status(400).send("Unsupported unit")
            } else {
                throw exception
            }
        }
    }
}