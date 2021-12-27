import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { EProductUnit, ProductPrice } from "../model/ProductPrice"
import { IImageRepository } from "../repository/IImageRepository"
import { IProductPriceRepository } from "../repository/IPriceRepository"
import { IProductRepository } from "../repository/IProductRepository"
import { TYPES } from "../types"
import chai from 'chai'
import { Product } from "../model/Product"

describe('Price repository test', async () => {
    let priceRepository: IProductPriceRepository
    let productRepository: IProductRepository
    let imageRepository: IImageRepository
    let createdPrices : ProductPrice[]
    let createdProduct: Product

    beforeEach(async () => {
        priceRepository = myContainer.get<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY)
        productRepository = myContainer.get<IProductRepository>(TYPES.PRODUCT_REPOSITORY)
        imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
        await createProduct()
    })

    async function createProduct() {
        let image = await imageRepository.createImage()
        createdProduct = await productRepository.createProduct({
            id: null,
            serialNumber: '',
            name: 'product_1',
            isDeleted: false,
            avatarId: image.id,
            createdTimeStamp: null,
            rank: 0,
            wholesalePrices: ['wholesale_price_1', 'wholesale_price_2'],
            description: 'description',
            imagesId: [],
        })
        createdPrices = await priceRepository.createProductPrice(createdProduct.id!, [
            {
                id: null,
                unit: EProductUnit.KG,
                isDeleted: false,
                isDefault: true,
                defaultPrice: new Decimal('100'),
                priceLevels: [
                    {
                        minQuantity: new Decimal('100'),
                        price: new Decimal('80.05')
                    },
                    {
                        minQuantity: new Decimal('100.005'),
                        price: new Decimal('80.0005'),
                    }
                ],
            },
            {
                id: null,
                unit: EProductUnit.KG,
                isDeleted: false,
                isDefault: false,
                defaultPrice: new Decimal('100'),
                priceLevels: [],
            },
        ])
    }

    describe('fetch price by id', async () => {
        it('Should succeed', async () => {
            let price = await priceRepository.fetchPriceById(createdPrices[0].id!)
            chai.expect(price).to.eql({
                id: price.id,
                unit: EProductUnit.KG,
                isDeleted: false,
                isDefault: true,
                defaultPrice: '100',
                priceLevels: [
                    {
                        minQuantity: '100',
                        price: '80.05',
                    },
                    {
                        minQuantity: '100.005',
                        price: '80.0005',
                    },
                ],
            })
        })
    })

    describe('fetch prices by product id', async () => {
        it('should succeed', async () => {
            let prices = await priceRepository.fetchPricesByProductId(createdProduct.id!)
            chai.expect(prices).to.eql([
                {
                    id: prices[0].id,
                    unit: EProductUnit.KG,
                    isDeleted: false,
                    isDefault: true,
                    defaultPrice: '100',
                    priceLevels: [
                        {
                            minQuantity: '100',
                            price: '80.05',
                        },
                        {
                            minQuantity: '100.005',
                            price: '80.0005',
                        },
                    ],
                },
                {
                    id: prices[1].id,
                    unit: EProductUnit.KG,
                    isDeleted: false,
                    isDefault: false,
                    defaultPrice: '100',
                    priceLevels: [],
                },
            ])
        })
    })
})