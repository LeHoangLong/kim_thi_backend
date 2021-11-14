import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { Address } from "../model/Address"
import { IAddressRepository } from "../repository/IAddressRepository"
import { TYPES } from "../types"
import chai from 'chai'
import { ICustomerContactRepository } from "../repository/ICustomerContactRepository"
import { CustomerContact } from "../model/CustomerContact"
import { IOrderRepository } from "../repository/IOrderRepository"
import { EProductUnit } from "../model/ProductPrice"
import { AreaTransportFee } from "../model/AreaTransportFee"
import { IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository"
import { EndUserOrderView } from "../view/EndUserOrderView"
import { Request, request, Response } from "express"
import sinon, { SinonSpy } from "sinon"
import { IProductRepository } from "../repository/IProductRepository"
import { Product } from "../model/Product"
import { IImageRepository } from "../repository/IImageRepository"
import { Image } from "../model/Image"
import { ProductController } from "../controller/ProductController"
import { MockOrderRepository } from "./mocks/MockOrderRepository"
import { OrderRepositoryPostgres } from "../repository/OrderRepositoryPostgres"
import { MockEndUserTransportFeeController } from "./mocks/MockTransportFeeController"
import { EndUserTransportFeeController } from "../controller/EndUserTransportFeeController"
import { MockEndUserAddressController } from "./mocks/MockEndUserAddressController"
import { EndUserAddressController } from "../controller/EndUserAddressController"
import { Order } from "../model/Order"
import { MockEmailService } from "./mocks/MockEmailService"
import { IEmailService } from "../services/IEmailService"
import { EMailService } from "../services/EmailService"

describe('Test order repository', async () => {
    let customerContact: CustomerContact
    let address: Address
    let areaTransportFee: AreaTransportFee
    describe('create order', async () => {
        beforeEach(async () => {
            let customerContactRepository = myContainer.get<ICustomerContactRepository>(TYPES.CUSTOMER_CONTACT_REPOSITORY)
            customerContact = await customerContactRepository.createCustomerContact({phoneNumber: '+1234567', email: 'email@google.com'})
            let addressRepostory = myContainer.get<IAddressRepository>(TYPES.ADDRESS_REPOSITORY)
            address = await addressRepostory.createAddress('address-1', new Decimal('10.000001'), new Decimal('20.000002'), 'city-1')
            let areaTransportFeeRepository = myContainer.get<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY)
            areaTransportFee = await areaTransportFeeRepository.createFee({
                name: 'fee_1',
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                billBasedTransportFee: [{
                    minBillValue: new Decimal('100.01'),
                    basicFee: new Decimal('10.01'),
                    fractionOfBill: new Decimal('0.02'),
                    fractionOfTotalTransportFee: new Decimal('0.03'),
                }],
                distanceFeePerKm: new Decimal(10000.05),
                transportOriginIds: [],
                isDeleted: false,
            });
        })
        it('should succeed', async () => {
            let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
            let order = await orderRepository.createOrder({
                items: [
                    {
                        id: -1,
                        quantity: new Decimal(1),
                        price: new Decimal('100.05'),
                        unit: EProductUnit.KG,
                    },
                    {
                        id: -1,
                        quantity: new Decimal(2),
                        price: new Decimal('200.05'),
                        unit: EProductUnit.KG,
                    },
                ],
                message: 'message-1',
                paymentAmount: new Decimal('100000.001'),
                customerContact: customerContact,
                shippingAddress: address,
                areaTransportFee: areaTransportFee,
            })

            chai.expect(order).to.eql({
                id: order.id,
                items: [
                    {
                        id: order.items[0].id,
                        quantity: new Decimal(1),
                        price: new Decimal('100.05'),
                        unit: EProductUnit.KG,
                    },
                    {
                        id: order.items[1].id,
                        quantity: new Decimal(2),
                        price: new Decimal('200.05'),
                        unit: EProductUnit.KG,
                    },
                ],
                isShipped: false,
                isReceived: false,
                isPaid: false,
                isCancelled: false,
                cancellationReason: '',
                customerMessage: 'message-1',
                customerContact: customerContact,
                paymentAmount: new Decimal('100000.001'),
                address: address,
                areaTransportFee: areaTransportFee,
            })
        })
    })
})

describe('Test enduser order view', async () => {
    let request: any
    let response: any
    let sendSpy: SinonSpy
    let statusSpy: SinonSpy
    let product: Product
    let image: Image
    let mockOrderRepository: MockOrderRepository
    let mockEndUserTransportFeeController: MockEndUserTransportFeeController
    let mockEndUserAddressController: MockEndUserAddressController
    let mockEmailService: MockEmailService
    beforeEach(async  () => {
        request = {

        }
        response = {
            status(statusCode: number): any {
                return this
            },
            send(): any {
                return this
            },
        }

        statusSpy = sinon.spy(response, "status")
        sendSpy = sinon.spy(response, "send")

        let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
        image = await imageRepository.createImage()

        let productController = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER)
        let productWithPricesAndImages = await productController.createProduct({
            serialNumber: '0', 
            name: 'product-0',
            avatarId: image.id,
            rank: 1,
            wholesalePrices: ['wholesale-price-1', 'wholesale-price-2'],
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
        })

        product = productWithPricesAndImages.product

        mockOrderRepository = new MockOrderRepository()
        myContainer.rebind<IOrderRepository>(TYPES.ORDER_REPOSITORY).toConstantValue(mockOrderRepository)

        mockEndUserTransportFeeController = new MockEndUserTransportFeeController()
        myContainer.rebind<EndUserTransportFeeController>(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER).toConstantValue(mockEndUserTransportFeeController)
    
        mockEndUserAddressController = new MockEndUserAddressController()
        myContainer.rebind<EndUserAddressController>(TYPES.END_USER_ADDRESS_CONTROLLER).toConstantValue(mockEndUserAddressController)

        mockEmailService = new MockEmailService()
        myContainer.rebind<IEmailService>(TYPES.EMAIL_SERVICE).toConstantValue(mockEmailService)

        mockEndUserTransportFeeController.transportFees.push({
            id: 0,
            name: 'address-1',
            areaCity: 'city',
            basicFee: new Decimal('100'),
            billBasedTransportFee: [{
                fractionOfBill: new Decimal('0.01')
            }],
            distanceFeePerKm: new Decimal(0),
            transportOriginIds: [0],
            isDeleted: false,
        })

        mockEndUserTransportFeeController.transportOrigins.push({
            id: 0,
            address: 'origin-1',
            latitude: new Decimal('100.000001'),
            longitude: new Decimal('200.000001'),
            city: 'city',
            isDeleted: false,           
        })
    })

    afterEach(() => {
        myContainer.rebind<IOrderRepository>(TYPES.ORDER_REPOSITORY).to(OrderRepositoryPostgres)
        myContainer.rebind<EndUserTransportFeeController>(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER).to(EndUserTransportFeeController)
        myContainer.rebind<EndUserAddressController>(TYPES.END_USER_ADDRESS_CONTROLLER).to(EndUserAddressController)
        myContainer.rebind<IEmailService>(TYPES.EMAIL_SERVICE).to(EMailService)
    })

    describe('create order', async () => {
        it('should succeed', async () => {
            let endUserOrderView = myContainer.get<EndUserOrderView>(TYPES.END_USER_ORDER_VIEW)
            request.body = {
                items: [
                    {
                        productId: product.id,
                        unit: 'kg',
                        quantity: '10',
                    }
                ],
                address: {
                    latitude: '100.000001',
                    longitude: '200.000001',
                },
                customerContact: {
                    phoneNumber: '+84123456',
                },
                expectedPrice: '1110.505',
                customerMessage: 'message-1'
            }
        
            await endUserOrderView.createOrder(request as Request, response as Response)
            sinon.assert.calledOnceWithExactly(statusSpy, 201)
            sinon.assert.calledOnce(sendSpy)
            chai.expect(sendSpy.getCall(0).args[0].id).to.eql(0)
            chai.expect(sendSpy.getCall(0).args[0].items).to.eql([{
                id: 0,
                unit: 'KG',
                quantity: '10',
                price: '100.05',
            }])
            chai.expect(sendSpy.getCall(0).args[0].isShipped).to.eql(false)
            chai.expect(sendSpy.getCall(0).args[0].isReceived).to.eql(false)
            chai.expect(sendSpy.getCall(0).args[0].isPaid).to.eql(false)
            chai.expect(sendSpy.getCall(0).args[0].isCancelled).to.eql(false)
            chai.expect(sendSpy.getCall(0).args[0].customerMessage).to.eql('message-1')
            chai.expect(sendSpy.getCall(0).args[0].customerContact).to.eql({
                id: sendSpy.getCall(0).args[0].customerContact.id,
                isDeleted: false,
                phoneNumber: '+84123456',
            })
            chai.expect(sendSpy.getCall(0).args[0].paymentAmount).to.eql('1110.505')
            chai.expect(sendSpy.getCall(0).args[0].address).to.eql({
                id: 0,
                address: 'address',
                city: 'city',
                latitude: '100.000001',
                longitude: '200.000001',
                isDeleted: false,
            })
            chai.expect(sendSpy.getCall(0).args[0].areaTransportFee).to.eql({  
                id: 0,
                name: 'address-1',
                areaCity: 'city',
                basicFee: '100',
                billBasedTransportFee: [
                    {
                        fractionOfBill: "0.01"
                    },
                ],
                distanceFeePerKm: '0',
                transportOriginIds: [ 0 ],
                isDeleted: false
            })
            chai.expect(mockOrderRepository.orders.length).to.eql(1)
            chai.expect(mockEmailService.sentEmails.length).to.eql(1)
        })
        it('should fail if mismatch', async () => {
            
            let endUserOrderView = myContainer.get<EndUserOrderView>(TYPES.END_USER_ORDER_VIEW)
            request.body = {
                items: [
                    {
                        productId: product.id,
                        unit: 'kg',
                        quantity: '10',
                    }
                ],
                address: {
                    latitude: '100.000001',
                    longitude: '200.000001',
                },
                customerContact: {
                    phoneNumber: '+84123456',
                },
                expectedPrice: '1000.5001',
                customerMessage: 'message-1'
            }
            
            await endUserOrderView.createOrder(request as Request, response as Response)
            sinon.assert.calledOnceWithExactly(statusSpy, 400)          
            chai.expect(mockOrderRepository.orders.length).to.eql(0)
            chai.expect(mockEmailService.sentEmails.length).to.eql(0)
        })
    })
})