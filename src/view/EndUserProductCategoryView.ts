import { inject, injectable } from "inversify";
import { ProductCategoryController } from "../controller/ProductCategoryController";
import { TYPES } from "../types";
import express from 'express';
const config = require('../config').config;

@injectable()
export class EndUserProductCategoryView {
    constructor(
        @inject(TYPES.PRODUCT_CATEGORY_CONTROLLER) private controller: ProductCategoryController
    ) {
    }


    async fetchProductCategoriesView(request: express.Request, response: express.Response) {
        try {
            let limit = parseInt(request.query.limit as string)
            if (isNaN(limit)) {
                limit = config.pagination.defaultSize
            }

            let offset = parseInt(request.query.offset as string)

            if (isNaN(offset)) {
                offset = 0
            }
            let categories = await this.controller.fetchCategories(limit, offset)
            return response.status(200).send(categories)
        } catch (exception) {
            return response.status(502).send(exception)
        }
    }

    async fetchNumberOfCategoriesView(request: express.Request, response: express.Response) {
        try {
            let count = await this.controller.getNumberOfCategories()
            return response.status(200).send(count.toString())
        } catch (exception) {
            return response.status(502).send(exception)
        }
    }
}