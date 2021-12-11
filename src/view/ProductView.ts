import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express, { CookieOptions } from 'express';
import { ProductImageController } from '../controller/ImageController';
import { CreateProductArgs, ProductController } from '../controller/ProductController';
const config = require('../config').config;
import { UnrecognizedEnumValue } from '../exception/UnrecognizedEnumValue';
import { EProductUnit, EProductUnitToString, ProductPrice, stringToEProductUnit } from '../model/ProductPrice';
import { NotFound } from '../exception/NotFound';
import { normalizeProductPrice, parseProductPrice } from '../parsers/ProductPriceParser';
import { parseProductSummary } from '../parsers/ProductParser';

@injectable()
export class ProductView {
    constructor(
        @inject(TYPES.PRODUCT_IMAGE_CONTROLLER) private imageController : ProductImageController,
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

        let search = ''
        if (typeof(request.query.productSearch) === 'string') {
            search = request.query.productSearch
        }

        let [count, products] = await this.productController.findProductsByName(search, offset, limit);
        for (let i = 0; i < products.length; i++) {
            products[i] = parseProductSummary(products[i])
        }
        return response.status(200).send(products);
    }

    async fetchProductsCount(request: express.Request, response: express.Response) {
        let numberOfProducts = await this.productController.fetchNumberOfProducts()
        response.status(200).send(numberOfProducts.toString())
    }

    private _validateCreateOrUpdateInput(request: express.Request, response: express.Response) :  boolean {
        let productId = parseInt(request.params.id)
        let valid = true
        if (isNaN(productId)) {
            valid = false
        }

        if (request.params.serialNumber === undefined) {
            valid = false
        }        


        return true
    }

    async updateProduct(request: express.Request, response: express.Response) {
        try {
            let productId = parseInt(request.params.id)
            if (isNaN(productId)) {
                return response.status(400).send()
            }
            
            let [alternativePrices, defaultPrice] = this.convertPrice(request.body)
            for (let i = 0 ; i < alternativePrices.length ; i ++) {
                alternativePrices[i] = normalizeProductPrice(alternativePrices[i])
            }

            defaultPrice = normalizeProductPrice(defaultPrice)

            let productWithPrices = await this.productController.updateProduct(productId, {
                serialNumber: request.body.serialNumber,
                name: request.body.name,
                avatarId: request.body.avatar.id,
                defaultPrice: defaultPrice,
                alternativePrices: alternativePrices,
                rank: request.body.rank,
                categories: request.body.categories,
                wholesalePrices: request.body.wholesalePrices?? [],
            })

            productWithPrices.prices = [...productWithPrices.prices]
            for (let i = 0; i < productWithPrices.prices.length; i++) {
                productWithPrices.prices[i] = parseProductPrice(productWithPrices.prices[i])
            }
            return response.status(200).send(productWithPrices)
        } catch (exception) {
            if (exception instanceof NotFound) {
                return response.status(404).send()
            } else {
                return response.status(500).send(exception)
            }
        }
    }
    
    async deleteProduct(request: express.Request, response: express.Response) {
        try {
            let productId = parseInt(request.body.id)
            if (isNaN(productId)) {
                return response.status(400).send()
            }
            await this.productController.deleteProduct(productId)
        } catch (exception) {
            return response.status(500).send(exception)
        }
    }

    private convertPrice(body: any) : [ProductPrice[],ProductPrice] {
        let defaultPrice = {
            ...body.defaultPrice,
            isDefault: true,
        }

        let alternativePrices : ProductPrice[] = []
        for (let i = 0; i < body.alternativePrices.length; i++) {
            alternativePrices.push({
                ...body.alternativePrices[i],
                isDefault: false,
            })
            if (alternativePrices[i].id === undefined) {
                alternativePrices[i].id = null
            }

            if (alternativePrices[i].isDeleted === undefined) {
                alternativePrices[i].isDeleted = false
            }
        }

        if (defaultPrice.id === undefined) {
            defaultPrice.id = null
        }
        if (defaultPrice.isDeleted === undefined) {
            defaultPrice.isDeleted = false
        }

        return [alternativePrices, defaultPrice]
    }

    async createProduct(request: express.Request, response: express.Response) {
        try {
            let [alternativePrices, defaultPrice] = this.convertPrice(request.body)
            for (let i = 0 ; i < alternativePrices.length ; i ++) {
                alternativePrices[i] = normalizeProductPrice(alternativePrices[i])
            }
            defaultPrice = normalizeProductPrice(defaultPrice)
            let args: CreateProductArgs = {
                serialNumber: request.body.serialNumber,
                name: request.body.name,
                avatarId: request.body.avatar.id,
                defaultPrice: defaultPrice,
                alternativePrices: alternativePrices,
                rank: request.body.rank,
                categories: request.body.categories,
                wholesalePrices: request.body.wholesalePrices,
            }

            let productWithPrices = await this.productController.createProduct(args)

            productWithPrices.prices = [...productWithPrices.prices]
            for (let i = 0; i < productWithPrices.prices.length; i++) {
                productWithPrices.prices[i] = parseProductPrice(productWithPrices.prices[i])
            }

            return response.status(201).send(productWithPrices)
        } catch (exception) {
            console.log('exception')
            console.log(exception)
            if (exception instanceof UnrecognizedEnumValue) {
                return response.status(400).send("Unsupported unit")
            } else {
                return response.status(500).send(exception)
            }
        }
    }

    async fetchProductDetailById(request: express.Request, response: express.Response) {
        if (request.params.id === undefined) {
            return response.status(400).send('Missing id')
        }
        let productId = parseInt(request.params.id)
        let productDetail = await this.productController.fetchProductDetailById(productId)
        for (let i = 0; i < productDetail.prices.length; i++) {
            productDetail.prices[i] = parseProductPrice(productDetail.prices[i])
        }
        return response.status(200).send(productDetail)
    }
}