import { Request, Response } from "express";
import { ProductController, ProductSummary } from "../controller/ProductController";
import { myContainer } from "../inversify.config";
import { EProductUnitToString } from "../model/ProductPrice";
import { TYPES } from "../types";
import config from '../config'
import { ProductCategoryController } from "../controller/ProductCategoryController";

export async function productSummaryPage(request: Request, response: Response) {
    let controller = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER);
    let categoryController = myContainer.get<ProductCategoryController>(TYPES.PRODUCT_CATEGORY_CONTROLLER)
    let pageNumber = parseInt(request.query.pageNumber as string);
    if (isNaN(pageNumber)) {
        pageNumber = 0;
    }

    let categoryStr = request.query.categories as string;

    let productSummaries: ProductSummary[] = [];
    if (categoryStr) {
        productSummaries = await controller.fetchProductsByCategory(categoryStr, pageNumber * config.pagination.defaultSize, config.pagination.defaultSize);
    } else {
        productSummaries = await controller.fetchProductSummaries(pageNumber * config.pagination.defaultSize, config.pagination.defaultSize);
    }

    for (let i = 0; i < productSummaries.length; i++) {
        productSummaries[i].defaultPrice.unit = EProductUnitToString(productSummaries[i].defaultPrice.unit) as any;
    }
    let productsCount = await controller.fetchNumberOfProducts()
    let categories = await categoryController.fetchCategories(config.pagination.defaultSize, 0)
    for (let i = 0; i < categories.length; i++) {
        if (categories[i].category === categoryStr) {
            (categories[i] as any).isSelected = true
        } else {
            (categories[i] as any).isSelected = false
        }
    }
    return response.status(200).render('productSummariesPage.ejs', {
        products: productSummaries,
        pageNumber,
        numberOfPages: Math.ceil(productsCount / config.pagination.defaultSize),
        searchTerm: "",
        categories: categories
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
        categories: null,
    })
}
