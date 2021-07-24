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
import { IConnectionFactory } from '../services/IConnectionFactory';
import { PostgresConnectionFactory } from '../services/PostgresConnectionFactory';
import { DatabaseError, PoolClient } from 'pg';
import { Product } from '../model/Product';
import chaiSubset from 'chai-subset';

import chaiAsPromised from 'chai-as-promised'
import { Image } from '../model/Image';
import { ProductRepositoryPostgres } from '../repository/ProductRepositoryPostgres';
import { PriceRepositoryPostgres } from '../repository/PriceRepositoryPostgres';
import { ImageRepositoryPostgres } from '../repository/ImageRepositoryPostgres';
import { BinaryRepositoryFileSystem } from '../repository/BinaryRepositoryFilesystem';
import { ProductCategoryRepositoryPostgres } from '../repository/ProductCategoryRepositoryPostgres';
chai.use(chaiAsPromised);
chai.use(chaiSubset)

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

    this.afterAll(async function() {
        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).to(ProductRepositoryPostgres)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).to(PriceRepositoryPostgres)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).to(ImageRepositoryPostgres)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).to(BinaryRepositoryFileSystem)
        myContainer.rebind<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY).to(ProductCategoryRepositoryPostgres)
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

describe('Postgres product repository test', async function() {
    describe('create product', async function() {
        let product : Product
        let productRepository: IProductRepository
        beforeEach(async function() {
            productRepository = myContainer.get<IProductRepository>(TYPES.PRODUCT_REPOSITORY)
            let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
            let image = await imageRepository.createImage()
            product = await productRepository.createProduct({
                id: null,
                serialNumber: '',
                name: 'product_1',
                isDeleted: false,
                avatarId: image.id,
                createdTimeStamp: null,
                rank: 0,
            })
            
        })

        it('should succeed', async function() {
            let productCategoryRepository = myContainer.get<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY)
            await productCategoryRepository.createProductCategory('cat_1')
            await productCategoryRepository.createProductCategory('cat_2')
            await productRepository.createProductCategory(product.id!, ['cat_1', 'cat_2'])
            let categories = await productRepository.fetchProductCategories(product.id!)
            chai.expect(categories.length).to.eql(2)
            
        })
    
        it('Should throw if not have corresponding category', async function() {
            let exceptionCalled = 0
            try {
                await productRepository.createProductCategory(product.id!, ['cat_1', 'cat_2'])
            } catch (exception) {
                chai.assert.instanceOf(exception, DatabaseError)
                exceptionCalled++
            }
            chai.expect(exceptionCalled).to.eql(1)
            
        })
    })
    
    describe('Fetch product', async function() {
        let product : Product
        let productRepository: IProductRepository
        let image: Image
        beforeEach(async function() {
            productRepository = myContainer.get<IProductRepository>(TYPES.PRODUCT_REPOSITORY)
            let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
            let productCategoryRepository = myContainer.get<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY)
            image = await imageRepository.createImage()
            await productCategoryRepository.createProductCategory('cat_1')
            await productCategoryRepository.createProductCategory('cat_2')
            
            for (let i = 0; i < 5; i++) {
                product = await productRepository.createProduct({
                    id: null,
                    serialNumber: '',
                    name: `product_${i}`,
                    isDeleted: false,
                    avatarId: image.id,
                    createdTimeStamp: null,
                    rank: 0,
                })
                if (i % 2 == 1) {
                    await productRepository.createProductCategory(product.id!, ['cat_1'])
                } else {
                    await productRepository.createProductCategory(product.id!, ['cat_2'])
                }
            }

            let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        })

        it('can fetch count', async function() {
            let count = await productRepository.fetchNumberOfProducts()
            chai.expect(count).to.eql(5)
            
        })

        it('can fetch multiple products', async function() {
            let products = await productRepository.fetchProducts(1, 2);
            chai.expect(products.length).to.eql(2)
            chai.expect(products[0]).to.containSubset({
                serialNumber: '',
                name: `product_3`,
                isDeleted: false,
                avatarId: image.id,
                rank: 0,
            })
            chai.expect(products[0]).to.have.property('id')
            chai.expect(products[0]).to.have.property('createdTimeStamp')
            chai.expect(products[1]).to.containSubset({
                serialNumber: '',
                name: `product_2`,
                isDeleted: false,
                avatarId: image.id,
                rank: 0,
            })
            chai.expect(products[1]).to.have.property('id')
            chai.expect(products[1]).to.have.property('createdTimeStamp')
            
        })

        it('Can fetch product by id', async function() {
            let fetchedProduct = await productRepository.fetchProductById(product.id!)
            chai.expect(fetchedProduct).to.containSubset({
                serialNumber: '',
                name: `product_4`,
                isDeleted: false,
                avatarId: image.id,
                rank: 0,
            })
            chai.expect(fetchedProduct).to.have.property('id')
            chai.expect(fetchedProduct).to.have.property('createdTimeStamp')
            
        })

        it('Can fetch products by category', async function() {
            let fetchedProducts = await productRepository.fetchProductsByCategory('cat_1', 5, 0)
            chai.expect(fetchedProducts.length).to.eql(2)
            chai.expect(fetchedProducts[0]).to.containSubset({
                serialNumber: '',
                name: `product_3`,
                isDeleted: false,
                avatarId: image.id,
                rank: 0,
            })
            chai.expect(fetchedProducts[0]).to.have.property('id')
            chai.expect(fetchedProducts[0]).to.have.property('createdTimeStamp')

            chai.expect(fetchedProducts[1]).to.containSubset({
                serialNumber: '',
                name: `product_1`,
                isDeleted: false,
                avatarId: image.id,
                rank: 0,
            })
            chai.expect(fetchedProducts[1]).to.have.property('id')
            chai.expect(fetchedProducts[1]).to.have.property('createdTimeStamp')
            
        })

        it('Can fetch product id', async function() {
            let fetchedCategories = await productRepository.fetchProductCategories(product.id!)
            chai.expect(fetchedCategories.length).to.eql(1)
            chai.expect(fetchedCategories[0]).to.eql({ category: 'cat_2' })
            
        })

        it('Can find product count by name', async function() {
            let count = await productRepository.fetchProductsCountWithName('t_1')
            chai.expect(count).to.eql(1)

            count = await productRepository.fetchProductsCountWithName('product')
            chai.expect(count).to.eql(5)
            
        })

        it('Can find product name', async function() {
            let fetchedProducts = await productRepository.findProductsByName('t_1', 0, 5)
            chai.expect(fetchedProducts.length).to.eql(1)
            chai.expect(fetchedProducts[0]).to.containSubset({
                serialNumber: '',
                name: `product_1`,
                isDeleted: false,
                avatarId: image.id,
                rank: 0,
            })
            chai.expect(fetchedProducts[0]).to.have.property('id')
            chai.expect(fetchedProducts[0]).to.have.property('createdTimeStamp')
            
        })
    })

    describe('Delete product', async function() {
        let product : Product
        let productRepository: IProductRepository
        let image: Image
        let factory : PostgresConnectionFactory
        beforeEach(async function() {
            factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
            productRepository = myContainer.get<IProductRepository>(TYPES.PRODUCT_REPOSITORY)
            let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
            let productCategoryRepository = myContainer.get<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY)
            image = await imageRepository.createImage()
            await productCategoryRepository.createProductCategory('cat_1')
            await productCategoryRepository.createProductCategory('cat_2')

            for (let i = 0; i < 5; i++) {
                product = await productRepository.createProduct({
                    id: null,
                    serialNumber: '',
                    name: `product_${i}`,
                    isDeleted: false,
                    avatarId: image.id,
                    createdTimeStamp: null,
                    rank: 0,
                })
            }
        })

        it('can soft delete product', async function() {
            let count = await productRepository.fetchNumberOfProducts()
            chai.expect(count).eql(5)
            await productRepository.deleteProduct(product.id!)
            await factory.getConnection(1, async function(connection: PoolClient) {
                let response = await connection.query(`SELECT COUNT(*) FROM "product"`)
                chai.expect(parseInt(response.rows[0].count)).to.eql(5)
            })
            count = await productRepository.fetchNumberOfProducts()
            chai.expect(count).eql(4)
            
        })
    })
})