import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../src/types';
import { myContainer } from "../src/inversify.config";
import { UserView } from "../src/view/UserView";
import { JwtAuthenticator } from "../src/middleware/JwtAuthenticator";
import { CookieOptions, Request, Response } from "express";
import bcrypt from 'bcrypt';
import { ProductView } from '../src/view/ProductView';
import { IProductRepository } from '../src/repository/IProductRepository';
import { IProductPriceRepository } from '../src/repository/IPriceRepository';
import { Product } from '../src/model/Product';
import { EProductUnit, ProductPrice } from '../src/model/ProductPrice';
import { IImageRepository } from '../src/repository/IImageRepository';
import { Image } from '../src/model/Image';
import { IBinaryRepository } from '../src/repository/IBinaryRepository';

describe('Product view test', async function() {
    let context : any = {}
    this.beforeEach(function() {
        var now = new Date();
        var clock = sinon.useFakeTimers(now);
        const productRepository : IProductRepository = {
            createProduct(product: Product): Promise<Product> {
                throw "";
            },
            
            async fetchNumberOfProducts(): Promise<number> {
                return 15;
            },

            async fetchProducts(offset: number, limit: number): Promise<Product[]> {
                let ret : Product[] = []
                for (let i = 0; i < limit; i++) {
                    ret.push({
                        id: (i + offset).toString(),
                        name: 'name_' + (i + offset).toString(),
                        isDeleted: false,
                        avatarId: '0',
                        displayPriceId: i + offset,
                        createdTimeStamp: new Date(),
                        rank: 0,
                    })
                }
                return ret
            },
        }

        const iProductPriceRepository : IProductPriceRepository = {
            createPrice(price: ProductPrice) : Promise<ProductPrice> {
                throw ""
            },
            async fetchPriceById(id: number) : Promise<ProductPrice> {
                return {
                    id: id,
                    unit: EProductUnit.KG,
                    minQuantity: 0,
                    price: 100,
                    isDeleted: false,
                }
            },
        }

        const iImageRepository : IImageRepository = {
            async fetchImageById(imageId: string) : Promise<Image> {
                return {
                    id: imageId,
                    isDeleted: false,
                    createdTimeStamp: new Date(),
                }
            },

            createImage(imageId?: string) : Promise<Image> {
                throw ""
            },
            
            deleteImage(imageId: string) : Promise<number> {
                throw ""
            }
        }

        const iBinaryRepository : IBinaryRepository = {
            async save(namespace: string, id: string, data: Buffer) : Promise<boolean> {
                return true
            },

            getPath(namespace: string, id: string) : string {
                return namespace + "_" + id
            },
        }

        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).toConstantValue(productRepository)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).toConstantValue(iProductPriceRepository)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(iImageRepository)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).toConstantValue(iBinaryRepository)
    
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
        context.iImageRepository = iImageRepository
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