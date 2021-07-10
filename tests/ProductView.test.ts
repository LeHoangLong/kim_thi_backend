import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../src/types';
import { myContainer } from "../src/inversify.config";
import { ProductView } from '../src/view/ProductView';
import { IProductRepository } from '../src/repository/IProductRepository';
import { IProductPriceRepository } from '../src/repository/IPriceRepository';
import { IImageRepository } from '../src/repository/IImageRepository';
import { IBinaryRepository } from '../src/repository/IBinaryRepository';
import { MockProductRepository } from './mocks/MockProductRepository';
import { iProductPriceRepository } from './mocks/MockProductPriceRepository';
import { MockImageRepository } from './mocks/MockImageRepository';
import { MockBinaryRepository } from './mocks/MockBinaryRepository';
import { Request, Response } from 'express';
import chai from 'chai'
import { EProductUnit } from '../src/model/ProductPrice';

describe('Product view test', async function() {
    let context : any = {}
    this.beforeEach(function() {
        var now = new Date();
        var clock = sinon.useFakeTimers(now);
        const mockImageRepository = new MockImageRepository()
        const mockBinaryRepository = new MockBinaryRepository()
        const mockProductRepository = new MockProductRepository()
        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).toConstantValue(mockProductRepository)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).toConstantValue(iProductPriceRepository)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository)
    
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
        context.iProductPriceRepository = iProductPriceRepository
        context.mockImageRepository = mockImageRepository
        context.request = request
        context.response = response
        context.now = now

        context.statusSpy = sinon.spy(context.response, "status")
        context.sendSpy = sinon.spy(context.response, "send")
    })

    it('Fetch multiple products', async function() {
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
            images: [],
            avatar: {
              id: 0,
              isDeleted: false,
              createdTimeStamp: context.now,
              path: 'product_images_0'
            }
        })

        // check that data was actually saved
        let mockProductRepository = context.productRepository as MockProductRepository
        chai.expect(mockProductRepository.prices.size).to.equals(1)
        chai.expect(mockProductRepository.prices.get(0)).to.deep.equals([
            {
                unit: EProductUnit.KG,
                defaultPrice: 101,
                priceLevels: [{
                    minQuantity: 15,
                    price: 50
                }],
                isDefault: false
            },
            {
                unit: EProductUnit.KG,
                defaultPrice: 101,
                priceLevels: [{
                    minQuantity: 15,
                    price: 50
                }],
                isDefault: true
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
            images: []
        })
    })
})