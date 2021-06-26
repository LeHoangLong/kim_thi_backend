import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../src/types';
import { myContainer } from "../src/inversify.config";
import { ProductView } from '../src/view/ProductView';
import { IProductRepository } from '../src/repository/IProductRepository';
import { IProductPriceRepository } from '../src/repository/IPriceRepository';
import { IImageRepository } from '../src/repository/IImageRepository';
import { IBinaryRepository } from '../src/repository/IBinaryRepository';
import { productRepository } from './mocks/MockProductRepository';
import { iProductPriceRepository } from './mocks/MockProductPriceRepository';
import { MockImageRepository } from './mocks/MockImageRepository';
import { MockBinaryRepository } from './mocks/MockBinaryRepository';
import { Request, Response } from 'express';

describe('Product view test', async function() {
    let context : any = {}
    this.beforeEach(function() {
        var now = new Date();
        var clock = sinon.useFakeTimers(now);
        const mockImageRepository = new MockImageRepository()
        const mockBinaryRepository = new MockBinaryRepository()
        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).toConstantValue(productRepository)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).toConstantValue(iProductPriceRepository)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository)
    
        let request = {
            body: {
                limit: 2,
                offset: 2,
            }
        }

        let response = {
            send(body: any) {
                return this
            },
            status(status: number) {
                return this
            },
        }

        context.productRepository = productRepository
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
                    id: '2',
                    name: 'name_2',
                    isDeleted: false,
                    avatarId: '0',
                    displayPriceId: 2,
                    createdTimeStamp: context.now,
                    rank: 0
                },
                displayPrice: { 
                    id: 2, 
                    unit: 0, 
                    minQuantity: 0, 
                    price: 100, 
                    isDeleted: false 
                },
                image: {
                    id: '0',
                    isDeleted: false,
                    createdTimeStamp: context.now,
                    path: 'product_images_0'
                }
            },
            {
                product: {
                    id: '3',
                    name: 'name_3',
                    isDeleted: false,
                    avatarId: '0',
                    displayPriceId: 3,
                    createdTimeStamp: context.now,
                    rank: 0
                },
                displayPrice: { 
                    id: 3, 
                    unit: 0, 
                    minQuantity: 0, 
                    price: 100, 
                    isDeleted: false 
                },
                image: {
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
})