import { Request, Response } from "express";
import { ProductController } from "../controller/ProductController";
import { myContainer } from "../inversify.config";
import { EProductUnitToString } from "../model/ProductPrice";
import { TYPES } from "../types";
import config from '../../config.json'

export async function productSummaryPage(request: Request, response: Response) {
    let controller = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER);
    let pageNumber = parseInt(request.query.pageNumber as string);
    if (isNaN(pageNumber)) {
        pageNumber = 0;
    }

    let productSummaries = await controller.fetchProductSummaries(pageNumber * config.pagination.defaultSize, config.pagination.defaultSize);
    for (let i = 0; i < productSummaries.length; i++) {
        productSummaries[i].defaultPrice.unit = EProductUnitToString(productSummaries[i].defaultPrice.unit) as any;
    }
    let productsCount = await controller.fetchNumberOfProducts()
    return response.status(200).render('productSummariesPage.ejs', {
        products: productSummaries,
        pageNumber,
        numberOfPages: Math.ceil(productsCount / config.pagination.defaultSize),
        searchTerm: "",
    })
}

export async function productDetailPage(request: Request, response: Response) {
    let productId = parseInt(request.params.productId)
    if (isNaN(productId)) {
        return response.status(400).send()
    }
    let productController = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER)
    let productDetail = await productController.fetchProductDetailById(productId) 
    for (let i = 0; i < productDetail.prices.length; i++) {
        productDetail.prices[i].unit = EProductUnitToString(productDetail.prices[i].unit).toLowerCase() as any;
    }
    return response.status(200).render('productDetailPage.ejs', {
        product: productDetail,
    })
}

export async function productSearchPage(request: Request, response: Response) {
    let productController = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER)
    let pageNumber = parseInt(request.query.pageNumber as string);
    if (isNaN(pageNumber)) {
        pageNumber = 0;
    }
    let phrase = request.query.phrase
    if (typeof(phrase) !== typeof("")) {
        phrase = ""
    }
    let [count, productSummaries] = await productController.findProductsByName(
        phrase as string,
        pageNumber * config.pagination.defaultSize,
        config.pagination.defaultSize
    )
    for (let i = 0; i < productSummaries.length; i++) {
        productSummaries[i].defaultPrice.unit = EProductUnitToString(productSummaries[i].defaultPrice.unit).toLowerCase() as any;
    }

    return response.status(200).render('productSummariesPage.ejs', {
        products: productSummaries,
        pageNumber,
        numberOfPages: Math.ceil(count / config.pagination.defaultSize),
        searchTerm: phrase,
    })
}
