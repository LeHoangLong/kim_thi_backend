import { inject, injectable } from "inversify";
import { ProductCategoryController } from "../controller/ProductCategoryController";
import { TYPES } from "../types";
import express from 'express';
import config from "../config";

@injectable()
export class ProductCategoryView {
    constructor(
        @inject(TYPES.PRODUCT_CATEGORY_CONTROLLER) private controller: ProductCategoryController
    ) {
    }

    async createProductCategoryView(request: express.Request, response: express.Response) {
        try {
            console.log(request.body)
            console.log(typeof(request.body.category))
            if (typeof(request.body.category) !== "string") {
                return response.status(400).send()
            } 
            let category = await this.controller.createCategory(request.body.category)
            return response.status(201).send(category)
        } catch (exception) {
            return response.status(502).send(exception)
        }
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

    async deleteProductCategoriesView(request: express.Request, response: express.Response) {
        try {
            if (typeof(request.body.category) !== "string") {
                return response.status(400).send()
            } 
            await this.controller.deleteCategory(request.body.category)
            return response.status(204).send()
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