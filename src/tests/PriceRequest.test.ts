import Decimal from "decimal.js"
import SQL from "sql-template-strings"
import { ProductController } from "../controller/ProductController"
import myContainer from "../inversify.config"
import { Image } from "../model/Image"
import { Product } from "../model/Product"
import { EProductUnit } from "../model/ProductPrice"
import { IImageRepository } from "../repository/IImageRepository"
import { CreatePriceRequestArgs, CreatePriceRequestItemArgs, IPriceRequestRepository } from "../repository/iPriceRequestRepository"
import { PriceRepositoryPostgres } from "../repository/PriceRepositoryPostgres"
import { PriceRequestRepositoryPostgres } from "../repository/PriceRequestRepositoryPostgres"
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory"
import { TYPES } from "../types"
import chai from 'chai'
import Sinon from "sinon"
import { MockPriceRequestRepository } from "./mocks/MockPriceRequestRepository"
import { EndUserPriceRequestView } from "../view/EndUserPriceRequestView"
import { MockEmailService } from "./mocks/MockEmailService"
import { IEmailService } from "../services/IEmailService"

describe('Price request repository test', () => {
    describe('posgres', () => {
        let product: Product
        let image: Image
        let priceRequestRepository: PriceRequestRepositoryPostgres
        
        beforeEach(async () => {
            priceRequestRepository = myContainer.get<PriceRequestRepositoryPostgres>(TYPES.PRICE_REQUEST_REPOSITORY)
        
            let productController = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER)
            
            let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
            image = await imageRepository.createImage()

            let productWithPricesAndImages = await productController.createProduct({
                serialNumber: '0', 
                name: 'product-0',
                avatarId: image.id,
                rank: 1,
                wholesalePrices: ['wholesale-price-1', 'wholesale-price-2'],
                description: 'description',
                defaultPrice: {
                    id: null,
                    unit: EProductUnit.KG,
                    defaultPrice: new Decimal('100.05'),
                    isDeleted: false,
                    priceLevels: [],
                    isDefault: true,
                },
                alternativePrices: [],
                categories: [],
                imagesId: [],
            })

            product = productWithPricesAndImages.product

        })

        describe('create price request', () => {
            it('should succeed', async () => {
                let arg: CreatePriceRequestArgs = {
                    customerAddress: 'address-1',
                    customerMessage: 'message-1',
                    customerPhone: 'phone-1',
                    customerName: 'customer-1',
                    items: [
                        {
                            productId: product.id!,
                            quantity: new Decimal(10),
                            unit: EProductUnit.KG,
                        }
                    ]
                }
                let request = await priceRequestRepository.createPriceRequest(arg)

                let connectionFactory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
                await connectionFactory.getConnection(0, async connection => {
                    let response = await connection.query(SQL`
                        SELECT * 
                        FROM "price_request"
                        WHERE id = ${request.id}
                    `)

                    chai.expect(response.rows.length).to.eql(1)
                    chai.expect(response.rows[0].id).to.eql(request.id)
                    chai.expect(response.rows[0].customer_message).to.eql(arg.customerMessage)
                    chai.expect(response.rows[0].customer_address).to.eql(arg.customerAddress)
                    chai.expect(response.rows[0].customer_name).to.eql(arg.customerName)
                    chai.expect(response.rows[0].customer_phone).to.eql(arg.customerPhone)
                    chai.expect(response.rows[0].created_time).to.not.eql(null)
                })
            })
        })
    })
})

describe('Price request view test', () => {
    let mockPriceRequestRepository: MockPriceRequestRepository
    let request: any
    let response: any
    let statusSpy: Sinon.SinonSpy
    let sendSpy: Sinon.SinonSpy
    let now: Date
    let mockEmailService: MockEmailService
    let product: Product

    beforeEach(async () => {
        now = new Date();
        var clock = Sinon.useFakeTimers(now);
        mockPriceRequestRepository = new MockPriceRequestRepository()
        mockEmailService = new MockEmailService()
        

        let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
        let image = await imageRepository.createImage()

        let productController = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER)
        let productWithPricesAndImages = await productController.createProduct({
            serialNumber: '0', 
            name: 'product-0',
            avatarId: image.id,
            rank: 1,
            wholesalePrices: ['wholesale-price-1', 'wholesale-price-2'],
            description: 'description',
            defaultPrice: {
                id: null,
                unit: EProductUnit.KG,
                defaultPrice: new Decimal('100.05'),
                isDeleted: false,
                priceLevels: [],
                isDefault: true,
            },
            alternativePrices: [],
            categories: [],
            imagesId: [],
        })
        product = productWithPricesAndImages.product

        myContainer.rebind<IPriceRequestRepository>(TYPES.PRICE_REQUEST_REPOSITORY).toConstantValue(mockPriceRequestRepository)
        myContainer.rebind<IEmailService>(TYPES.EMAIL_SERVICE).toConstantValue(mockEmailService)
        
    })
    describe('end user', () => {
        let endUserPriceRequestView: EndUserPriceRequestView
        beforeEach(() => {
            endUserPriceRequestView = myContainer.get<EndUserPriceRequestView>(TYPES.END_USER_PRICE_REQUEST_VIEW)

            request = {
                body: {
                },
                params: {
                },
                query: {
                },
            }

            response = {
                send(body: any) {
                    return this
                },
                status(status: number) {
                    return this
                },
            }


            statusSpy = Sinon.spy(response, "status")
            sendSpy = Sinon.spy(response, "send")
        })

        describe('create price request', () => {
            it('should succeed',async () => {
                let items: any[] = [] 
                items.push({
                    productId: product.id,
                    quantity: '1.5',
                    unit: 'kg'
                })
                request.body = {
                    customerAddress: 'customerAddress',
                    customerMessage: 'customerMessage',
                    customerPhone: 'customerPhone',
                    customerName: 'customerName',
                    items: items,
                }
                
                await endUserPriceRequestView.createPriceRequest(request, response)
                statusSpy.calledOnceWithExactly(201)
                
                chai.expect(mockPriceRequestRepository.itemCounter).to.eql(1)
                chai.expect(mockPriceRequestRepository.priceRequests.length).to.eql(1)
                chai.expect(
                    mockPriceRequestRepository.
                    priceRequests[0].
                    items[0].
                    quantity.
                    equals(new Decimal('1.5')
                )).to.be.true
                

                chai.expect(sendSpy.getCall(0).args[0]).to.eql({
                    id: 0,
                    customerAddress: 'customerAddress',
                    customerMessage: 'customerMessage',
                    customerPhone: 'customerPhone',
                    customerName: 'customerName',
                    items: [{
                        id: 0,
                        productId: product.id,
                        quantity: '1.5',
                        unit: 'kg'
                    }],
                    createdTime: now.toISOString(),
                })

                chai.expect(mockEmailService.sentEmails.length).to.eql(1)
                chai.expect(mockEmailService.sentEmails[0].content).to.eql(`Tên khách: customerName\nĐịa chỉ: customerAddress\nLời nhắn: customerMessage\nSĐT: customerPhone\n\tTên hàng\t|\tSố lượng\t|\tĐơn vị\n\tproduct-0\t|\t1.5\t|\tKG\n`)
            })
        })
    })
})