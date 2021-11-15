import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express from 'express';
import { ProductController } from '../controller/ProductController';
const config = require('../config').config;
import { EProductUnitToString } from '../model/ProductPrice';
import { NotFound } from '../exception/NotFound';

@injectable()
export class EndUserProductView {
    constructor(
        @inject(TYPES.PRODUCT_CONTROLLER) public productController: ProductController,
    ) {}

    async fetchProducts(request: express.Request, response: express.Response) {
        let limit = parseInt(request.query.limit as string);
        let offset = parseInt(request.query.offset as string);
        if (isNaN(limit)) {
            limit = config.pagination.defaultSize;
        }
        if (isNaN(offset)) {
            offset = 0;
        }

        let products = await this.productController.fetchProductSummaries(offset, limit);
        return response.status(200).send(products);
    }

    async fetchProductsCount(request: express.Request, response: express.Response) {
        let numberOfProducts = await this.productController.fetchNumberOfProducts()
        response.status(200).send(numberOfProducts.toString())
    }

    async fetchProductDetailById(request: express.Request, response: express.Response) {
        if (request.params.id === undefined) {
            return response.status(400).send('Missing id')
        }
        try {
            let productId = parseInt(request.params.id)
            let productDetail = await this.productController.fetchProductDetailById(productId)
            productDetail.prices.forEach(e => (e.unit as any) = EProductUnitToString(e.unit))
            let ret :any = {...productDetail}
            delete ret['prices']
            ret.defaultPrice = productDetail.prices.find(e => e.isDefault)
            ret.alternativePrices = productDetail.prices.filter(e => !e.isDefault)
            
            return response.status(200).send(ret)
        } catch (exception) {
            if (exception instanceof NotFound) {
                return response.status(404).send()
            } else {
                console.log('exception')
                console.log(exception)
                return response.status(500).send(exception)
            }
        }
    }
}