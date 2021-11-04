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

        let products = await this.productController.fetchProductSummaries(offset, limit);
        return response.status(200).send(products);
    }

    async fetchProductsCount(request: express.Request, response: express.Response) {
        let numberOfProducts = await this.productController.fetchNumberOfProducts()
        response.status(200).send(numberOfProducts.toString())
    }

    async updateProduct(request: express.Request, response: express.Response) {
        try {
            let productId = parseInt(request.params.id)
            if (isNaN(productId)) {
                return response.status(400).send()
            }
            let [alternativePrices, defaultPrice] = this.convertPrice(request.body)
            let productWithPrices = await this.productController.updateProduct(productId, {
                serialNumber: request.body.serialNumber,
                name: request.body.name,
                avatarId: request.body.avatar.id,
                defaultPrice: defaultPrice,
                alternativePrices: alternativePrices,
                rank: request.body.rank,
                categories: request.body.categories,
                areaTransportFeeIds: request.body.areaTransportFeeIds,
                wholesalePrices: request.body.wholesalePrices?? [],
            })
            productWithPrices.prices.forEach((e) => {
                let unitStr = EProductUnitToString(e.unit)
                e.unit = unitStr as any
            })

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
            unit: stringToEProductUnit(body.defaultPrice.unit),
            isDefault: true,
        }

        let alternativePrices : ProductPrice[] = []
        for (let i = 0; i < body.alternativePrices.length; i++) {
            alternativePrices.push({
                ...body.alternativePrices[i],
                unit: stringToEProductUnit(body.alternativePrices[i].unit),
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
            let args: CreateProductArgs = {
                serialNumber: request.body.serialNumber,
                name: request.body.name,
                avatarId: request.body.avatar.id,
                defaultPrice: defaultPrice,
                alternativePrices: alternativePrices,
                rank: request.body.rank,
                categories: request.body.categories,
                areaTransportFeeIds: request.body.areaTransportFeeIds,
                wholesalePrices: request.body.wholesalePrices,
            }

            let productWithPrices = await this.productController.createProduct(args)

            productWithPrices.prices.forEach((e) => {
                let unitStr = EProductUnitToString(e.unit)
                e.unit = unitStr as any
            })

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
        productDetail.prices.forEach(e => (e.unit as any) = EProductUnitToString(e.unit))
        return response.status(200).send(productDetail)
    }
}