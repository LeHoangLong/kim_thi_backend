import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express from 'express';
import { ProductController } from '../controller/ProductController';
const config = require('../config').config;
import { EProductUnitToString } from '../model/ProductPrice';
import { NotFound } from '../exception/NotFound';
import { parseProductSummary } from '../parsers/ProductParser';
import { ProductSearchFilter } from '../repository/IProductRepository';

@injectable()
export class EndUserProductView {
    constructor(
        @inject(TYPES.PRODUCT_CONTROLLER) public productController: ProductController,
    ) {}

    parseProductFilter(request: express.Request) : ProductSearchFilter {
        let search = ''
        if (typeof(request.query.productSearch) === 'string') {
            search = request.query.productSearch
        }

        let category = ''
        if (typeof(request.query.categories) === 'string') {
            category = request.query.categories
        } else if (Array.isArray(request.query.categories) && request.query.categories.length > 0) {
            category = request.query.categories[0] as string
        }

        return {
            category: category,
            name: search,
        }
    }

    async fetchProducts(request: express.Request, response: express.Response) {
        let limit = parseInt(request.query.limit as string);
        let offset = parseInt(request.query.offset as string);
        if (isNaN(limit)) {
            limit = config.pagination.defaultSize;
        }
        if (isNaN(offset)) {
            offset = 0;
        }

        let filter = this.parseProductFilter(request)

        let [count, products] = await this.productController.fetchProducts(filter.name!, filter.category!, offset, limit);
        for (let i = 0; i < products.length; i++) {
            products[i] = parseProductSummary(products[i])
        }
        return response.status(200).send(products);
    }

    async fetchProductsCount(request: express.Request, response: express.Response) {
        let filter = this.parseProductFilter(request)
        let numberOfProducts = await this.productController.fetchNumberOfProducts(filter)
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