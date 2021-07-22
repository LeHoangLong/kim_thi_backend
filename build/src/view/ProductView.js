"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
exports.ProductView = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("../types");
const config_1 = __importDefault(require("../config"));
const UnrecognizedEnumValue_1 = require("../exception/UnrecognizedEnumValue");
const ProductPrice_1 = require("../model/ProductPrice");
const NotFound_1 = require("../exception/NotFound");
let ProductView = class ProductView {
    constructor(imageController, productController) {
        this.imageController = imageController;
        this.productController = productController;
    }
    fetchProducts(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            let limit = parseInt(request.query.limit);
            let offset = parseInt(request.query.offset);
            if (isNaN(limit)) {
                limit = config_1.default.pagination.defaultSize;
            }
            if (isNaN(offset)) {
                offset = 0;
            }
            let products = yield this.productController.fetchProductSummaries(offset, limit);
            return response.status(200).send(products);
        });
    }
    fetchProductsCount(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            let numberOfProducts = yield this.productController.fetchNumberOfProducts();
            response.status(200).send(numberOfProducts);
        });
    }
    updateProduct(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let productId = parseInt(request.params.id);
                if (isNaN(productId)) {
                    return response.status(400).send();
                }
                let [alternativePrices, defaultPrice] = this.convertPrice(request.body);
                let productWithPrices = yield this.productController.updateProduct(productId, {
                    serialNumber: request.body.serialNumber,
                    name: request.body.name,
                    avatarId: request.body.avatar.id,
                    defaultPrice: defaultPrice,
                    alternativePrices: alternativePrices,
                    rank: request.body.rank,
                    categories: request.body.categories,
                });
                productWithPrices.prices.forEach((e) => {
                    let unitStr = ProductPrice_1.EProductUnitToString(e.unit);
                    e.unit = unitStr;
                });
                return response.status(200).send(productWithPrices);
            }
            catch (exception) {
                return response.status(500).send(exception);
            }
        });
    }
    convertPrice(body) {
        let defaultPrice = Object.assign(Object.assign({}, body.defaultPrice), { unit: ProductPrice_1.stringToEProductUnit(body.defaultPrice.unit) });
        let alternativePrices = [];
        for (let i = 0; i < body.alternativePrices.length; i++) {
            alternativePrices.push(Object.assign(Object.assign({}, body.alternativePrices[i]), { unit: ProductPrice_1.stringToEProductUnit(body.alternativePrices[i].unit) }));
        }
        return [alternativePrices, defaultPrice];
    }
    createProduct(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let [alternativePrices, defaultPrice] = this.convertPrice(request.body);
                let productWithPrices = yield this.productController.createProduct({
                    serialNumber: request.body.serialNumber,
                    name: request.body.name,
                    avatarId: request.body.avatar.id,
                    defaultPrice: defaultPrice,
                    alternativePrices: alternativePrices,
                    rank: request.body.rank,
                    categories: request.body.categories,
                });
                productWithPrices.prices.forEach((e) => {
                    let unitStr = ProductPrice_1.EProductUnitToString(e.unit);
                    e.unit = unitStr;
                });
                return response.status(201).send(productWithPrices);
            }
            catch (exception) {
                if (exception instanceof UnrecognizedEnumValue_1.UnrecognizedEnumValue) {
                    return response.status(400).send("Unsupported unit");
                }
                else {
                    console.log(exception);
                    return response.status(500).send(exception);
                }
            }
        });
    }
    fetchProductDetailById(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request.params.id === undefined) {
                return response.status(400).send('Missing id');
            }
            let productId = parseInt(request.params.id);
            let productDetail = yield this.productController.fetchProductDetailById(productId);
            productDetail.prices.forEach(e => e.unit = ProductPrice_1.EProductUnitToString(e.unit));
            return response.status(200).send(productDetail);
        });
    }
    updateProductCategories(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let productCategories = yield this.productController.updateProductCategories(request.body.productId, request.body.categories);
                return response.status(200).send(productCategories);
            }
            catch (exception) {
                if (exception instanceof NotFound_1.NotFound) {
                    return response.status(404).send();
                }
                else {
                    return response.status(500).send();
                }
            }
        });
    }
};
ProductView = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.PRODUCT_IMAGE_CONTROLLER)),
    __param(1, inversify_1.inject(types_1.TYPES.PRODUCT_CONTROLLER))
], ProductView);
exports.ProductView = ProductView;
