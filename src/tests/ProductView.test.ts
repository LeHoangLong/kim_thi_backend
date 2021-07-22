import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../types';
import { myContainer } from "../inversify.config";
import { ProductView } from '../view/ProductView';
import { IProductRepository } from '../repository/IProductRepository';
import { IProductPriceRepository } from '../repository/IPriceRepository';
import { IImageRepository } from '../repository/IImageRepository';
import { IBinaryRepository } from '../repository/IBinaryRepository';
import { MockProductRepository } from './mocks/MockProductRepository';
import { MockProductPriceRepository } from './mocks/MockProductPriceRepository';
import { MockImageRepository } from './mocks/MockImageRepository';
import { MockBinaryRepository } from './mocks/MockBinaryRepository';
import { Request, Response } from 'express';
import chai from 'chai'
import { EProductUnit } from '../model/ProductPrice';
import { MockProductCategoryRepository } from './mocks/MockProductCategoryRepository';
import { IProductCategoryRepository } from '../repository/IProductCategoryRepository';

describe('Product view test', async function() {
    let context : any = {}
    this.beforeEach(async function() {
        var now = new Date();
        var clock = sinon.useFakeTimers(now);
        const mockImageRepository = new MockImageRepository()
        const mockBinaryRepository = new MockBinaryRepository()
        const mockProductRepository = new MockProductRepository()
        const mockProductPriceRepository = new MockProductPriceRepository()
        const mockProductCategoryRepository = new MockProductCategoryRepository()

        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).toConstantValue(mockProductRepository)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).toConstantValue(mockProductPriceRepository)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository)
        myContainer.rebind<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY).toConstantValue(mockProductCategoryRepository)

        let request = {
            body: {
            },
            params: {
            },
            query: {
                limit: 2,
                offset: 2,
            },
        }

        let response = {
            send(body: any) {
                return this
            },
            status(status: number) {
                return this
            },
        }

        context.productRepository = mockProductRepository
        context.mockProductPriceRepository = mockProductPriceRepository
        context.mockImageRepository = mockImageRepository
        context.mockProductCategoryRepository = mockProductCategoryRepository
        context.request = request
        context.response = response
        context.now = now

        context.statusSpy = sinon.spy(context.response, "status")
        context.sendSpy = sinon.spy(context.response, "send")
    })

    it('Fetch multiple products', async function() {
        // insert products
        await myContainer.get<IProductRepository>(TYPES.PRODUCT_REPOSITORY).createProduct({
            id: 2,
            serialNumber: '2',
            name: 'name_2',
            isDeleted: false,
            avatarId: '0',
            createdTimeStamp: context.now,
            rank: 0
        })
        await myContainer.get<IProductRepository>(TYPES.PRODUCT_REPOSITORY).createProduct({
            id: 3,
            serialNumber: '3',
            name: 'name_3',
            isDeleted: false,
            avatarId: '0',
            createdTimeStamp: context.now,
            rank: 0
        })
        let productView = myContainer.get<ProductView>(TYPES.PRODUCT_VIEW)
        await productView.fetchProducts(context.request as Request, context.response as Response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
        sinon.assert.calledOnceWithExactly(context.sendSpy, [
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
        ])
    });

    it('Fetch product count', async function() {
        let productView = myContainer.get<ProductView>(TYPES.PRODUCT_VIEW)
        await productView.fetchProductsCount(context.request as Request, context.response as Response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
        sinon.assert.calledOnceWithExactly(context.sendSpy, 15)
    })

    it('Create product', async function() {
        let productView = myContainer.get<ProductView>(TYPES.PRODUCT_VIEW)
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
        }
        await productView.createProduct(context.request as Request, context.response as Response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 201)
        // mock price repo will return a predefined set of prices
        // thus the returned values here dont match
        // but it is ok, we only need to check that prices are actually returned
        sinon.assert.calledOnceWithExactly(context.sendSpy, {
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
        })

        // check that data was actually saved
        let mockProductPriceRepository = context.mockProductPriceRepository as MockProductPriceRepository;
        chai.expect(mockProductPriceRepository.pricesByProductId.size).to.equals(1)
        chai.expect(mockProductPriceRepository.pricesByProductId.get(0)).to.deep.equals([
            {
                id: 0,
                unit: EProductUnit.KG,
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
                unit: EProductUnit.KG,
                defaultPrice: 101,
                priceLevels: [{
                    minQuantity: 15,
                    price: 50
                }],
                isDefault: false,
                isDeleted: false,
            },
        ])
    })


    it('Fetch product detail', async function() {
        let productView = myContainer.get<ProductView>(TYPES.PRODUCT_VIEW)
        context.request.params.id = 1
        await productView.fetchProductDetailById(context.request as Request, context.response as Response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
        sinon.assert.calledOnceWithExactly(context.sendSpy, {
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
        })
    })

    it('update product categories', async function() {
        let productView = myContainer.get<ProductView>(TYPES.PRODUCT_VIEW)
        context.request.body.categories = ['cat_2', 'cat_3']
        context.request.body.productId = 1
        await productView.updateProductCategories(context.request, context.response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
        sinon.assert.calledOnceWithExactly(context.sendSpy, [
            { category: 'cat_2' },
            { category: 'cat_3' },
        ])
    })

    it('update not found product return 404', async function() {
        let productView = myContainer.get<ProductView>(TYPES.PRODUCT_VIEW)
        context.request.body.categories = ['cat_2', 'cat_3']
        context.request.body.productId = 2
        context.productRepository.notFoundId.push(2)
        await productView.updateProductCategories(context.request, context.response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 404)
    })
})