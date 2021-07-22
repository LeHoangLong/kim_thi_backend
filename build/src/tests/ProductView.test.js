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
require("reflect-metadata");
const sinon_1 = __importDefault(require("sinon"));
const types_1 = require("../types");
const inversify_config_1 = require("../inversify.config");
const MockProductRepository_1 = require("./mocks/MockProductRepository");
const MockProductPriceRepository_1 = require("./mocks/MockProductPriceRepository");
const MockImageRepository_1 = require("./mocks/MockImageRepository");
const MockBinaryRepository_1 = require("./mocks/MockBinaryRepository");
const chai_1 = __importDefault(require("chai"));
const ProductPrice_1 = require("../model/ProductPrice");
const MockProductCategoryRepository_1 = require("./mocks/MockProductCategoryRepository");
describe('Product view test', function () {
    return __awaiter(this, void 0, void 0, function* () {
        let context = {};
        this.beforeEach(function () {
            return __awaiter(this, void 0, void 0, function* () {
                var now = new Date();
                var clock = sinon_1.default.useFakeTimers(now);
                const mockImageRepository = new MockImageRepository_1.MockImageRepository();
                const mockBinaryRepository = new MockBinaryRepository_1.MockBinaryRepository();
                const mockProductRepository = new MockProductRepository_1.MockProductRepository();
                const mockProductPriceRepository = new MockProductPriceRepository_1.MockProductPriceRepository();
                const mockProductCategoryRepository = new MockProductCategoryRepository_1.MockProductCategoryRepository();
                inversify_config_1.myContainer.rebind(types_1.TYPES.PRODUCT_REPOSITORY).toConstantValue(mockProductRepository);
                inversify_config_1.myContainer.rebind(types_1.TYPES.PRODUCT_PRICE_REPOSITORY).toConstantValue(mockProductPriceRepository);
                inversify_config_1.myContainer.rebind(types_1.TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository);
                inversify_config_1.myContainer.rebind(types_1.TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository);
                inversify_config_1.myContainer.rebind(types_1.TYPES.PRODUCT_CATEGORY_REPOSITORY).toConstantValue(mockProductCategoryRepository);
                let request = {
                    body: {},
                    params: {},
                    query: {
                        limit: 2,
                        offset: 2,
                    },
                };
                let response = {
                    send(body) {
                        return this;
                    },
                    status(status) {
                        return this;
                    },
                };
                context.productRepository = mockProductRepository;
                context.mockProductPriceRepository = mockProductPriceRepository;
                context.mockImageRepository = mockImageRepository;
                context.mockProductCategoryRepository = mockProductCategoryRepository;
                context.request = request;
                context.response = response;
                context.now = now;
                context.statusSpy = sinon_1.default.spy(context.response, "status");
                context.sendSpy = sinon_1.default.spy(context.response, "send");
            });
        });
        it('Fetch multiple products', function () {
            return __awaiter(this, void 0, void 0, function* () {
                // insert products
                yield inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_REPOSITORY).createProduct({
                    id: 2,
                    serialNumber: '2',
                    name: 'name_2',
                    isDeleted: false,
                    avatarId: '0',
                    createdTimeStamp: context.now,
                    rank: 0
                });
                yield inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_REPOSITORY).createProduct({
                    id: 3,
                    serialNumber: '3',
                    name: 'name_3',
                    isDeleted: false,
                    avatarId: '0',
                    createdTimeStamp: context.now,
                    rank: 0
                });
                let productView = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW);
                yield productView.fetchProducts(context.request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 200);
                sinon_1.default.assert.calledOnceWithExactly(context.sendSpy, [
                    {
                        product: {
                            id: 2,
                            serialNumber: '2',
                            name: 'name_2',
                            isDeleted: false,
                            avatarId: '0',
                            createdTimeStamp: context.now,
                            rank: 0
                        },
                        defaultPrice: {
                            id: 0,
                            unit: 0,
                            isDeleted: false,
                            defaultPrice: 100,
                            priceLevels: [],
                            isDefault: true
                        },
                        avatar: {
                            id: '0',
                            isDeleted: false,
                            createdTimeStamp: context.now,
                            path: 'product_images_0'
                        }
                    },
                    {
                        product: {
                            id: 3,
                            serialNumber: '3',
                            name: 'name_3',
                            isDeleted: false,
                            avatarId: '0',
                            createdTimeStamp: context.now,
                            rank: 0
                        },
                        defaultPrice: {
                            id: 0,
                            unit: 0,
                            isDeleted: false,
                            defaultPrice: 100,
                            priceLevels: [],
                            isDefault: true
                        },
                        avatar: {
                            id: '0',
                            isDeleted: false,
                            createdTimeStamp: context.now,
                            path: 'product_images_0'
                        }
                    }
                ]);
            });
        });
        it('Fetch product count', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let productView = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW);
                yield productView.fetchProductsCount(context.request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 200);
                sinon_1.default.assert.calledOnceWithExactly(context.sendSpy, 15);
            });
        });
        it('Create product', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let productView = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW);
                context.request = {
                    body: {
                        serialNumber: 'serial_number',
                        name: "product_name",
                        avatar: {
                            id: 0,
                        },
                        defaultPrice: {
                            unit: "KG",
                            defaultPrice: 101,
                            priceLevels: [{
                                    minQuantity: 15,
                                    price: 50
                                }]
                        },
                        alternativePrices: [
                            {
                                unit: "KG",
                                defaultPrice: 101,
                                priceLevels: [{
                                        minQuantity: 15,
                                        price: 50
                                    }]
                            }
                        ],
                        rank: 0,
                        categories: ["cat_1", "cat_2"]
                    }
                };
                yield productView.createProduct(context.request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 201);
                // mock price repo will return a predefined set of prices
                // thus the returned values here dont match
                // but it is ok, we only need to check that prices are actually returned
                sinon_1.default.assert.calledOnceWithExactly(context.sendSpy, {
                    product: {
                        id: 0,
                        serialNumber: 'serial_number',
                        name: 'product_name',
                        isDeleted: false,
                        avatarId: 0,
                        createdTimeStamp: context.now,
                        rank: 0
                    },
                    prices: [
                        {
                            id: 0,
                            unit: 'KG',
                            isDeleted: false,
                            defaultPrice: 101,
                            priceLevels: [{
                                    minQuantity: 15,
                                    price: 50
                                }],
                            isDefault: true
                        },
                        {
                            id: 1,
                            unit: 'KG',
                            isDeleted: false,
                            defaultPrice: 101,
                            priceLevels: [{
                                    minQuantity: 15,
                                    price: 50
                                }],
                            isDefault: false
                        }
                    ],
                    images: [],
                    avatar: {
                        id: 0,
                        isDeleted: false,
                        createdTimeStamp: context.now,
                        path: 'product_images_0'
                    },
                    categories: [
                        { category: 'cat_1' },
                        { category: 'cat_2' },
                    ]
                });
                // check that data was actually saved
                let mockProductPriceRepository = context.mockProductPriceRepository;
                chai_1.default.expect(mockProductPriceRepository.pricesByProductId.size).to.equals(1);
                chai_1.default.expect(mockProductPriceRepository.pricesByProductId.get(0)).to.deep.equals([
                    {
                        id: 0,
                        unit: ProductPrice_1.EProductUnit.KG,
                        defaultPrice: 101,
                        priceLevels: [{
                                minQuantity: 15,
                                price: 50
                            }],
                        isDefault: true,
                        isDeleted: false,
                    },
                    {
                        id: 1,
                        unit: ProductPrice_1.EProductUnit.KG,
                        defaultPrice: 101,
                        priceLevels: [{
                                minQuantity: 15,
                                price: 50
                            }],
                        isDefault: false,
                        isDeleted: false,
                    },
                ]);
            });
        });
        it('Fetch product detail', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let productView = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW);
                context.request.params.id = 1;
                yield productView.fetchProductDetailById(context.request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 200);
                sinon_1.default.assert.calledOnceWithExactly(context.sendSpy, {
                    product: {
                        id: 1,
                        serialNumber: '1',
                        name: 'name_1',
                        isDeleted: false,
                        avatarId: '0',
                        createdTimeStamp: context.now,
                        rank: 0
                    },
                    prices: [
                        {
                            id: 0,
                            unit: 'KG',
                            isDeleted: false,
                            defaultPrice: 100,
                            priceLevels: [],
                            isDefault: true
                        },
                        {
                            id: 1,
                            unit: 'KG',
                            isDeleted: false,
                            defaultPrice: 100,
                            priceLevels: [],
                            isDefault: false
                        }
                    ],
                    avatar: {
                        id: '0',
                        isDeleted: false,
                        createdTimeStamp: context.now,
                        path: 'product_images_0'
                    },
                    images: [],
                    categories: [
                        { category: 'cat_1' },
                        { category: 'cat_2' },
                    ],
                });
            });
        });
        it('update product categories', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let productView = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW);
                context.request.body.categories = ['cat_2', 'cat_3'];
                context.request.body.productId = 1;
                yield productView.updateProductCategories(context.request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 200);
                sinon_1.default.assert.calledOnceWithExactly(context.sendSpy, [
                    { category: 'cat_2' },
                    { category: 'cat_3' },
                ]);
            });
        });
        it('update not found product return 404', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let productView = inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW);
                context.request.body.categories = ['cat_2', 'cat_3'];
                context.request.body.productId = 2;
                context.productRepository.notFoundId.push(2);
                yield productView.updateProductCategories(context.request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 404);
            });
        });
    });
});
