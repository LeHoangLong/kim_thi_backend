import { Request, Response } from "express";
import { ProductController, ProductSummary } from "../controller/ProductController";
import { myContainer } from "../inversify.config";
import { EProductUnitToString } from "../model/ProductPrice";
import { TYPES } from "../types";
const config = require('../config').config;
import { ProductCategoryController } from "../controller/ProductCategoryController";

export async function productSummaryPage(request: Request, response: Response) {
    let controller = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER);
    let categoryController = myContainer.get<ProductCategoryController>(TYPES.PRODUCT_CATEGORY_CONTROLLER)
    let pageNumber = parseInt(request.query.pageNumber as string);
    if (isNaN(pageNumber)) {
        pageNumber = 0;
    }

    let phrase = request.query.phrase as string | undefined;
    if (phrase !== undefined && phrase.length === 0) {
        phrase = undefined
    }
    let categoryStr = request.query.categories as string | undefined;
    if (categoryStr !== undefined && categoryStr.length === 0) {
        categoryStr = undefined
    }

    let productSummaries: ProductSummary[] = [];
    if (categoryStr) {
        productSummaries = await controller.fetchProductsByCategory(categoryStr, pageNumber * config.pagination.defaultSize, config.pagination.defaultSize, phrase);
    } else if (typeof(phrase) === 'string') {
        let temp: number
        [temp, productSummaries] = await controller.fetchProducts(phrase, "", pageNumber * config.pagination.defaultSize, config.pagination.defaultSize)
    } else {
        productSummaries = await controller.fetchProductSummaries(pageNumber * config.pagination.defaultSize, config.pagination.defaultSize);
    }

    for (let i = 0; i < productSummaries.length; i++) {
        let summary = productSummaries[i]
        if (summary.defaultPrice !== undefined) {
            summary.defaultPrice.unit = EProductUnitToString(summary.defaultPrice.unit) as any;
        }
    }
    let productsCount = await controller.fetchNumberOfProducts({
        category: categoryStr!,
        name: phrase!,
    })
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
        categories: categories,
        query: request.query,
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
    
    let controller = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER);
    let productSummaries: ProductSummary[] = []
    if (productDetail.categories.length > 0) {
        productSummaries = await controller.fetchProductsByCategory(productDetail.categories[0].category, 0, config.pagination.defaultSize);
    }
    let index = productSummaries.findIndex(e => e.product.id === productDetail.product.id)
    if (index !== -1) {
        productSummaries.splice(index, 1)
    }

    return response.status(200).render('productDetailPage.ejs', {
        product: productDetail,
        query: request.query,
        products: productSummaries,
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
    let [count, productSummaries] = await productController.fetchProducts(
        phrase as string,
        "",
        pageNumber * config.pagination.defaultSize,
        config.pagination.defaultSize
    )
    for (let i = 0; i < productSummaries.length; i++) {
        let summary = productSummaries[i]
        if (summary.defaultPrice !== undefined) {
            summary.defaultPrice.unit = EProductUnitToString(summary.defaultPrice.unit) as any;
        }
    }

    return response.status(200).render('productSummariesPage.ejs', {
        products: productSummaries,
        pageNumber,
        numberOfPages: Math.ceil(count / config.pagination.defaultSize),
        searchTerm: phrase,
        categories: null,
    })
}
