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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const inversify_1 = require("inversify");
const uuidv4_1 = require("uuidv4");
const types_1 = require("../types");
let ProductController = class ProductController {
    constructor(connectionFactory, productRepository, productPriceRepository, productImageController, productCategoryRepository) {
        this.connectionFactory = connectionFactory;
        this.productRepository = productRepository;
        this.productPriceRepository = productPriceRepository;
        this.productImageController = productImageController;
        this.productCategoryRepository = productCategoryRepository;
    }
    createProduct(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let serialNumber = args.serialNumber;
            if (serialNumber === "") {
                serialNumber = uuidv4_1.uuid();
            }
            let product = {
                id: null,
                serialNumber: serialNumber,
                name: args.name,
                isDeleted: false,
                avatarId: args.avatarId,
                createdTimeStamp: new Date(),
                rank: args.rank,
            };
            let pricesToCreate = args.alternativePrices;
            args.defaultPrice.isDefault = true;
            pricesToCreate.forEach(e => e.isDefault = false);
            pricesToCreate.push(args.defaultPrice);
            let productPrices = [];
            let categories = [];
            yield this.connectionFactory.startTransaction([
                this.productRepository,
                this.productPriceRepository
            ], () => __awaiter(this, void 0, void 0, function* () {
                product = yield this.productRepository.createProduct(product);
                productPrices = yield this.productPriceRepository.createProductPrice(product.id, pricesToCreate);
                categories = yield this.productCategoryRepository.fetchProductCategoriesByProductId(product.id);
            }));
            let avatar = yield this.productImageController.fetchImageWithPath(product.avatarId);
            return {
                product: product,
                prices: productPrices,
                images: [],
                avatar: avatar,
                categories: categories,
            };
        });
    }
    _productsToProductSummaries(products) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            for (let i = 0; i < products.length; i++) {
                let product = products[i];
                let defaultPrice = yield this.productPriceRepository.fetchDefaultPriceByProductId(product.id);
                let avatar = yield this.productImageController.fetchImageWithPath(product.avatarId);
                let summary = {
                    product,
                    defaultPrice,
                    avatar
                };
                ret.push(summary);
            }
            return ret;
        });
    }
    fetchProductSummaries(offset, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            let products = yield this.productRepository.fetchProducts(offset, limit);
            return this._productsToProductSummaries(products);
        });
    }
    fetchProductDetailById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let product = yield this.productRepository.fetchProductById(id);
            let avatarWithImage = yield this.productImageController.fetchImageWithPath(product.avatarId);
            let productPrices = yield this.productPriceRepository.fetchPricesByProductId(product.id);
            let categories = yield this.productCategoryRepository.fetchProductCategoriesByProductId(product.id);
            return {
                product: product,
                prices: productPrices,
                avatar: avatarWithImage,
                images: [],
                categories: categories,
            };
        });
    }
    fetchNumberOfProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.productRepository.fetchNumberOfProducts();
        });
    }
    updateProduct(id, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.productRepository.deleteProduct(id);
            let prices = yield this.productPriceRepository.fetchPricesByProductId(id);
            for (let i = 0; i < prices.length; i++) {
                yield this.productPriceRepository.deletePrice(prices[i].id);
            }
            return this.createProduct(args);
        });
    }
    findProductsByName(name, offset, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = yield this.productRepository.fetchProductsCountWithName(name);
            let products = yield this.productRepository.findProductsByName(name, offset, limit);
            let productSummaries = yield this._productsToProductSummaries(products);
            return [count, productSummaries];
        });
    }
    updateProductCategories(productId, categories) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.productRepository.fetchProductById(productId); // check if product id exists
            return this.productRepository.updateProductCategories(productId, categories);
        });
    }
};
ProductController = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.CONNECTION_FACTORY)),
    __param(1, inversify_1.inject(types_1.TYPES.PRODUCT_REPOSITORY)),
    __param(2, inversify_1.inject(types_1.TYPES.PRODUCT_PRICE_REPOSITORY)),
    __param(3, inversify_1.inject(types_1.TYPES.PRODUCT_IMAGE_CONTROLLER)),
    __param(4, inversify_1.inject(types_1.TYPES.PRODUCT_CATEGORY_REPOSITORY))
], ProductController);
exports.ProductController = ProductController;
