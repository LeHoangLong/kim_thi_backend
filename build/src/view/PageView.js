"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSearchPage = exports.productDetailPage = exports.productSummaryPage = void 0;
const inversify_config_1 = require("../inversify.config");
const ProductPrice_1 = require("../model/ProductPrice");
const types_1 = require("../types");
const config_1 = __importDefault(require("../config"));
function productSummaryPage(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        let controller = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_CONTROLLER);
        let pageNumber = parseInt(request.query.pageNumber);
        if (isNaN(pageNumber)) {
            pageNumber = 0;
        }
        let productSummaries = yield controller.fetchProductSummaries(pageNumber * config_1.default.pagination.defaultSize, config_1.default.pagination.defaultSize);
        for (let i = 0; i < productSummaries.length; i++) {
            productSummaries[i].defaultPrice.unit = ProductPrice_1.EProductUnitToString(productSummaries[i].defaultPrice.unit);
        }
        let productsCount = yield controller.fetchNumberOfProducts();
        return response.status(200).render('productSummariesPage.ejs', {
            products: productSummaries,
            pageNumber,
            numberOfPages: Math.ceil(productsCount / config_1.default.pagination.defaultSize),
            searchTerm: "",
        });
    });
}
exports.productSummaryPage = productSummaryPage;
function productDetailPage(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        let productId = parseInt(request.params.productId);
        if (isNaN(productId)) {
            return response.status(400).send();
        }
        let productController = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_CONTROLLER);
        let productDetail = yield productController.fetchProductDetailById(productId);
        for (let i = 0; i < productDetail.prices.length; i++) {
            productDetail.prices[i].unit = ProductPrice_1.EProductUnitToString(productDetail.prices[i].unit).toLowerCase();
        }
        return response.status(200).render('productDetailPage.ejs', {
            product: productDetail,
        });
    });
}
exports.productDetailPage = productDetailPage;
function productSearchPage(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        let productController = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_CONTROLLER);
        let pageNumber = parseInt(request.query.pageNumber);
        if (isNaN(pageNumber)) {
            pageNumber = 0;
        }
        let phrase = request.query.phrase;
        if (typeof (phrase) !== typeof ("")) {
            phrase = "";
        }
        let [count, productSummaries] = yield productController.findProductsByName(phrase, pageNumber * config_1.default.pagination.defaultSize, config_1.default.pagination.defaultSize);
        for (let i = 0; i < productSummaries.length; i++) {
            productSummaries[i].defaultPrice.unit = ProductPrice_1.EProductUnitToString(productSummaries[i].defaultPrice.unit).toLowerCase();
        }
        return response.status(200).render('productSummariesPage.ejs', {
            products: productSummaries,
            pageNumber,
            numberOfPages: Math.ceil(count / config_1.default.pagination.defaultSize),
            searchTerm: phrase,
        });
    });
}
exports.productSearchPage = productSearchPage;
