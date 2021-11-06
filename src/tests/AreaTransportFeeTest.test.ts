import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../types';
import { myContainer } from "../inversify.config";
import { IProductRepository } from '../repository/IProductRepository';
import { IProductPriceRepository } from '../repository/IPriceRepository';
import { IImageRepository } from '../repository/IImageRepository';
import { IBinaryRepository } from '../repository/IBinaryRepository';
import { MockProductRepository } from './mocks/MockProductRepository';
import { MockProductPriceRepository } from './mocks/MockProductPriceRepository';
import { MockImageRepository } from './mocks/MockImageRepository';
import { MockBinaryRepository } from './mocks/MockBinaryRepository';
import chai from 'chai'
import { MockProductCategoryRepository } from './mocks/MockProductCategoryRepository';
import { IProductCategoryRepository } from '../repository/IProductCategoryRepository';
import chaiSubset from 'chai-subset';

import chaiAsPromised from 'chai-as-promised'
import { IAreaTransportFeeRepository } from '../repository/IAreaTransportFeeRepository';
import Decimal from 'decimal.js';
import { MockAreaTransportFeeRepository } from './mocks/MockAreaTransportFeeRepository';
import { TransportFeeView } from '../view/TransportFeeView';
import { MockGeocodingService } from './mocks/MockGeocoderService';
import { IGeocoderService } from '../services/IGeocoderService';
import { GoogleGeocoderService } from '../services/GoogleGeocoderService';
import { ProductRepositoryPostgres } from '../repository/ProductRepositoryPostgres';
import { PriceRepositoryPostgres } from '../repository/PriceRepositoryPostgres';
import { ImageRepositoryPostgres } from '../repository/ImageRepositoryPostgres';
import { BinaryRepositoryFileSystem } from '../repository/BinaryRepositoryFilesystem';
import { ProductCategoryRepositoryPostgres } from '../repository/ProductCategoryRepositoryPostgres';
import { AreaTransportFeeRepositoryPostgres } from '../repository/AreaTransportFeeRepositoryPostgres';
import { EndUserTransportFeeController } from '../controller/EndUserTransportFeeController';
import { EndUserTransportFeeView } from '../view/EndUserTransportFeeView';
chai.use(chaiAsPromised);
chai.use(chaiSubset)


describe('Area transport fee repository test', async function() {
    let context: any = {}
    let areaTransportFeeRepository: IAreaTransportFeeRepository
    beforeEach(async function() {
        areaTransportFeeRepository = myContainer.get<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY)
    })

    describe('create transport fee origin', async function() {
        it('should succeed', async () => {
            let origin = await areaTransportFeeRepository.createTransportOrigin({
                address: 'city_1',
                longitude: new Decimal('0.000001'),
                latitude: new Decimal('0.000002'),
                city: 'city-1',
            })

            chai.expect(origin.address).to.be.eql('city_1')
            chai.expect(origin.longitude.comparedTo(new Decimal('0.000001'))).to.be.eql(0)
            chai.expect(origin.latitude.comparedTo(new Decimal('0.000002'))).to.be.eql(0)
            chai.expect(origin.city).to.eql('city-1')
        })
    })

    describe('create transport fee', async function() {
        beforeEach(async () => {
            context.origin_1 = await areaTransportFeeRepository.createTransportOrigin({
                address: 'city_1',
                longitude: new Decimal('0.000001'),
                latitude: new Decimal('0.000002'),
                city: 'city-1',
            })
            context.origin_2 = await areaTransportFeeRepository.createTransportOrigin({
                address: 'city_1',
                longitude: new Decimal('0.000001'),
                latitude: new Decimal('0.000002'),
                city: 'city-1',
            })

        })
        it('should succeed', async function() {
            let fee = await areaTransportFeeRepository.createFee({
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
                transportOriginIds: [context.origin_1.id, context.origin_2.id],
                isDeleted: false,
            });
            chai.expect(fee.areaCity, "city")
            chai.expect(fee.name, "fee_1")
            chai.expect(fee.basicFee?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.distanceFeePerKm?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.billBasedTransportFee).to.be.eql([{
                minBillValue: new Decimal('100.01'),
                basicFee: new Decimal('10.01'),
                fractionOfBill: new Decimal('0.02'),
                fractionOfTotalTransportFee: new Decimal('0.03'),
            }])
            chai.expect(fee.transportOriginIds).to.be.eql([context.origin_1.id, context.origin_2.id])
        })
    })


    describe('fetch transport origin', async function() {
        beforeEach(async () => {
            context.fee_1 = await areaTransportFeeRepository.createTransportOrigin({
                address: 'city_1',
                longitude: new Decimal('0.000001'),
                latitude: new Decimal('0.000002'),
                city: 'city-1',
            })

            context.fee_2 = await areaTransportFeeRepository.createTransportOrigin({
                address: 'city_2',
                longitude: new Decimal('1.000001'),
                latitude: new Decimal('1.000002'),
                city: 'city-2',
            })
        })

        describe('fetch transport origin list', async function() {
            it('should succeed', async () => {
                let origins = await areaTransportFeeRepository.fetchTransportOrigins(1, 1)
                let origin = origins[0]
                chai.expect(origin.address).to.be.eql('city_1')
                chai.expect(origin.longitude.comparedTo(new Decimal('0.000001'))).to.be.eql(0)
                chai.expect(origin.latitude.comparedTo(new Decimal('0.000002'))).to.be.eql(0)

                let numberOfOrigins = await areaTransportFeeRepository.fetchNumberOfOrigins()
                chai.expect(numberOfOrigins).to.be.eql(2)
            })
        })

        describe('fetch transport origin by id', async () => {
            it('should succeed', async () => {
                let origins = await areaTransportFeeRepository.fetchTransportOriginsById([context.fee_1.id, context.fee_2.id])
                let origin = origins[0]
                chai.expect(origin.address).to.be.eql('city_2')
                chai.expect(origin.longitude.comparedTo(new Decimal('1.000001'))).to.be.eql(0)
                chai.expect(origin.latitude.comparedTo(new Decimal('1.000002'))).to.be.eql(0)

                origin = origins[1]
                chai.expect(origin.address).to.be.eql('city_1')
                chai.expect(origin.longitude.comparedTo(new Decimal('0.000001'))).to.be.eql(0)
                chai.expect(origin.latitude.comparedTo(new Decimal('0.000002'))).to.be.eql(0)
            })            
        })
    })


    describe('fetch transport fee', async function () {
        beforeEach(async () => {
            await areaTransportFeeRepository.createFee({
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                name: 'fee_1',
                billBasedTransportFee: [
                    {
                        minBillValue: new Decimal('100.01'),
                        basicFee: new Decimal('10.01'),
                        fractionOfBill: new Decimal('0.02'),
                        fractionOfTotalTransportFee: new Decimal('0.03'),
                    },
                    {
                        minBillValue: new Decimal('100.02'),
                        basicFee: new Decimal('10.02'),
                        fractionOfBill: new Decimal('0.03'),
                        fractionOfTotalTransportFee: new Decimal('0.04'),
                    },
                ],
                distanceFeePerKm: new Decimal(10000.05),
                transportOriginIds: [],
                isDeleted: false,
            });    
        })

        describe('fetch list', async () => {
            it('should succeed', async function() {
                let fees = await areaTransportFeeRepository.fetchFees(1, 0)
                let fee = fees[0]
                chai.expect(fee.name).to.be.equal('fee_1')
                chai.expect(fee.areaCity, "city")
                chai.expect(fee.basicFee?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
                chai.expect(fee.distanceFeePerKm?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
                chai.expect(fee.transportOriginIds).to.be.eql([])
                chai.expect(fee.billBasedTransportFee).to.be.eql([
                    {
                        minBillValue: new Decimal('100.01'),
                        basicFee: new Decimal('10.01'),
                        fractionOfBill: new Decimal('0.02'),
                        fractionOfTotalTransportFee: new Decimal('0.03'),
                    },
                    {
                        minBillValue: new Decimal('100.02'),
                        basicFee: new Decimal('10.02'),
                        fractionOfBill: new Decimal('0.03'),
                        fractionOfTotalTransportFee: new Decimal('0.04'),
                    },
                ])
            })
        })

        describe('check if city is supported', async() => {
            it('should say supported', async () => {
                let isSupported = await areaTransportFeeRepository.isCitySupported('city')
                chai.expect(isSupported).to.eql(true)
            })

            it('should say not supported', async () => {
                let isSupported = await areaTransportFeeRepository.isCitySupported('unsupported-city')
                chai.expect(isSupported).to.eql(false)
            })
        })

        describe('fetch fee by city', async() => {
            it('Should fetch city', async() => {
                let cities = await areaTransportFeeRepository.fetchFeesByCity('City', 100, 0, true)
                chai.expect(cities.length).to.eql(1)
                chai.expect(cities[0]).to.eql({
                    id: 1,
                    name: 'fee_1',
                    areaCity: 'city',
                    basicFee: new Decimal('10000.05'),
                    billBasedTransportFee: [
                      {
                        minBillValue: new Decimal('100.01'),
                        fractionOfBill: new Decimal('0.02'),
                        fractionOfTotalTransportFee: new Decimal('0.03'),
                        basicFee: new Decimal('10.01'),
                      },
                      {
                        minBillValue: new Decimal('100.02'),
                        fractionOfBill: new Decimal('0.03'),
                        fractionOfTotalTransportFee: new Decimal('0.04'),
                        basicFee: new Decimal('10.02'),
                      }
                    ],
                    distanceFeePerKm: new Decimal('10000.05'),
                    transportOriginIds: [],
                    isDeleted: false
                })
            })
            it('Should not fetch city', async() => {
                let cities = await areaTransportFeeRepository.fetchFeesByCity('not-city', 1000, 0, true)
                chai.expect(cities.length).to.eql(0)
            })
        })
    })

    describe('delete transport fee', function () {
        it('should succeed', async function() {
            let fee = await areaTransportFeeRepository.createFee({
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                name: '',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(10000.05),
                transportOriginIds: [],
                isDeleted: false,
            });
            let numberOfDeleted = await areaTransportFeeRepository.deleteFee(fee.id)
            chai.expect(numberOfDeleted).to.be.eql(1)

            let fees = await areaTransportFeeRepository.fetchFees(1, 0)
            chai.expect(fees.length).to.be.eql(0)
        })
    })

    describe('delete transport origin', function () {
        it('should succeed', async function() {
            let origin = await areaTransportFeeRepository.createTransportOrigin({
                address: 'city_1',
                longitude: new Decimal('0.000001'),
                latitude: new Decimal('0.000002'),
                city: 'city-1',
            })

            let number = await areaTransportFeeRepository.deleteTransportOriginById(origin.id)
            chai.expect(number).to.be.eql(1)
        })
    })
})


describe('Area transport fee view test', async () => {
    let context : any = {}
    beforeEach(() => {
        var now = new Date();
        var clock = sinon.useFakeTimers(now);
        const mockImageRepository = new MockImageRepository()
        const mockBinaryRepository = new MockBinaryRepository()
        const mockProductRepository = new MockProductRepository()
        const mockProductPriceRepository = new MockProductPriceRepository()
        const mockProductCategoryRepository = new MockProductCategoryRepository()
        const mockAreaTransportFeeRepository = new MockAreaTransportFeeRepository()
        const mockGeocoderService = new MockGeocodingService()

        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).toConstantValue(mockProductRepository)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).toConstantValue(mockProductPriceRepository)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository)
        myContainer.rebind<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY).toConstantValue(mockProductCategoryRepository)
        myContainer.rebind<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY).toConstantValue(mockAreaTransportFeeRepository)
        myContainer.rebind<IGeocoderService>(TYPES.GEOCODER_SERVICE).toConstantValue(mockGeocoderService)

        context.now = now
        context.areaTransportFeeRepository = mockAreaTransportFeeRepository

        let request: any = {}
        let response: any = {
            status() : any {
                return this
            },
            send() : any {

            },
        }

        context.request = request
        context.response = response
        context.statusSpy = sinon.spy(context.response, "status")
        context.sendSpy = sinon.spy(context.response, "send")
        context.mockProductRepository = mockProductRepository
        context.mockGeocoderService = mockGeocoderService
    })

    afterEach(() => {
        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).to(ProductRepositoryPostgres)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).to(PriceRepositoryPostgres)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).to(ImageRepositoryPostgres)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).to(BinaryRepositoryFileSystem)
        myContainer.rebind<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY).to(ProductCategoryRepositoryPostgres)
        myContainer.rebind<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY).to(AreaTransportFeeRepositoryPostgres)
        myContainer.rebind<IGeocoderService>(TYPES.GEOCODER_SERVICE).to(GoogleGeocoderService)
    })
    describe('create area transport fee view', async () => {
        it('Should succeed', async () => {
            context.request.body = {
                name: 'fee_1',
                city: 'city_1',
                originAddress: 'test-address',
                basicFee: '1000.01',
                transportOriginIds: [1, 2],
            }
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            await areaTransportFeeView.createAreaTransportView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 201)
            sinon.assert.calledOnceWithExactly(context.sendSpy, {
                id: 0,
                name: 'fee_1',
                areaCity: 'test-city',
                basicFee: '1000.01',
                billBasedTransportFee: [],
                transportOriginIds: [1, 2],
                isDeleted: false
            })
        })
    })
    describe('fetch area transport fee view', async () => {
        beforeEach(async () => {
            let mockRepository = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            context.fee_1 = await mockRepository.createFee({
                areaCity: "city-1",
                basicFee: new Decimal(10000.05),
                name: 'fee_1',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(10000.05),
                transportOriginIds: [],
                isDeleted: false,
            })
            context.fee_2 = await mockRepository.createFee({
                areaCity: "city-2",
                basicFee: new Decimal(20000.05),
                name: 'fee_2',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(20000.05),
                transportOriginIds: [],
                isDeleted: false,
            })
        })

        describe('fetch multiple fees', async () => {
            it('should succeed', async () => {
                let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
                context.request.query = {
                    limit: 2,
                    offset: 1,
                }
                await areaTransportFeeView.fetchAreaTransportView(context.request, context.response)
                sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
                sinon.assert.calledOnceWithExactly(context.sendSpy, [{
                    id: 1,
                    name: 'fee_2',
                    areaCity: "city-2",
                    basicFee: '20000.05',
                    billBasedTransportFee: [],
                    distanceFeePerKm: '20000.05',
                    transportOriginIds: [],
                    isDeleted: false,
                }])
            })
        })

        describe('fetch 1 fee', async () => {
            it('Should return 400 if no params', async () => {
                let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
                context.request.params = {
                }
                await areaTransportFeeView.fetchAreaTransportDetailView(context.request, context.response)
                sinon.assert.calledOnceWithExactly(context.statusSpy, 400)
            })

            it('Should return 404 if not found', async () => {
                let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
                context.request.params = {
                    id: 100
                }
                await areaTransportFeeView.fetchAreaTransportDetailView(context.request, context.response)
                sinon.assert.calledOnceWithExactly(context.statusSpy, 404)
            })

            it('should succeed', async () => {
                let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
                context.request.params = {
                    id: context.fee_1.id
                }
                await areaTransportFeeView.fetchAreaTransportDetailView(context.request, context.response)
                sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
                sinon.assert.calledOnceWithExactly(context.sendSpy, {
                    id: 0,
                    name: 'fee_1',
                    areaCity: "city-1",
                    basicFee: '10000.05',
                    billBasedTransportFee: [],
                    distanceFeePerKm: '10000.05',
                    transportOriginIds: [],
                    isDeleted: false,
                })
                
            })
        })
    })


    describe('Update area transport fee view', async () => {
        beforeEach(async () => {
            let mockRepository = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            let createdFee = await mockRepository.createFee({
                areaCity: "city-1",
                basicFee: new Decimal(10000.05),
                name: '',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(10000.05),
                transportOriginIds: [],
                isDeleted: false,
            })
            context.createdFee = createdFee
            context.mockTransportFeeRepository = mockRepository
        })

        it('can delete transport fee', async () => {
            let mockAreaTransportFee = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            mockAreaTransportFee.feesByProductId.set(0, [context.createdFee.id])
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            context.request.params = {
                id: context.createdFee.id,
            }
            await areaTransportFeeView.deleteAreaTransportFeeView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 204)
        })


        it('can update transport fee', async () => {
            let mockAreaTransportFee = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            mockAreaTransportFee.feesByProductId.set(0, [context.createdFee.id])
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            context.request.body = {
                originAddress: 'test-address',
                basicFee: '1000.01'
            }
            context.request.params = {
                id: context.createdFee.id
            }
            await areaTransportFeeView.updateAreaTransportFeeView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
            chai.expect(mockAreaTransportFee.fees[mockAreaTransportFee.fees.length - 1].basicFee).to.be.eql(new Decimal('1000.01'))
        })
    })

    describe('Create area transport origin', async () => {
        it('Return 400 if wrong param address', async () => {
            context.request.body = {
            }
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            await areaTransportFeeView.createTransportOriginView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 400)
            sinon.assert.calledOnceWithExactly(context.sendSpy)
            
        })
        it('Should succeed', async () => {
            context.request.body = {
                address: 'origin-1'
            }
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            await areaTransportFeeView.createTransportOriginView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 201)
            sinon.assert.calledOnceWithExactly(context.sendSpy, {
                id: 0,
                address: 'origin-1',
                latitude: '10.000001',
                longitude: '20.000001',
                city: 'test-city',
                isDeleted: false,
            })
        })
    })

    describe('Can fetch origins', async () => {
        beforeEach(async () => {
            let mockTransportFeeRepository = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            context.origin_1 = await mockTransportFeeRepository.createTransportOrigin({
                address: 'address-1',
                longitude: new Decimal('0.000001'),
                latitude: new Decimal('0.000002'),
                city: 'city-1',
            })

            context.origin_2 = await mockTransportFeeRepository.createTransportOrigin({
                address: 'address-2',
                longitude: new Decimal('1.000001'),
                latitude: new Decimal('1.000002'),
                city: 'city-2',
            })
        })

        it('Should succeed', async () => {
            context.request.query = {
                limit: 1,
                offset: 1,
            }

            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            await areaTransportFeeView.fetchTransportOriginView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
            sinon.assert.calledOnceWithExactly(context.sendSpy, [
                {
                    id: 1,
                    address: 'address-2',
                    city: 'city-2',
                    latitude: '1.000002',
                    longitude: '1.000001',
                    isDeleted: false,
                },
            ])
        })

        it('fetch number of origins', async () => {
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            await areaTransportFeeView.fetchTransportOriginCountView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
            sinon.assert.calledOnceWithExactly(context.sendSpy, '2')
        })

        it('fetch origins by id', async () => {
            context.request.query = {
                ids: [context.origin_1.id.toString(), context.origin_2.id.toString()],
            }

            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            await areaTransportFeeView.fetchTransportOriginByIdsView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
            sinon.assert.calledOnceWithExactly(context.sendSpy, [
                {
                    ...context.origin_1,
                    latitude: context.origin_1.latitude.toString(),
                    longitude: context.origin_1.longitude.toString(),
                },
                {
                    ...context.origin_2,
                    latitude: context.origin_2.latitude.toString(),
                    longitude: context.origin_2.longitude.toString(),
                },
            ])
        })
    })

    describe('End user transport view', async () => {
        let areaTransportFeeRepository : MockAreaTransportFeeRepository
        beforeEach(() => {
            areaTransportFeeRepository = context.areaTransportFeeRepository
            areaTransportFeeRepository.fees.push({
                id: 0,
                name: 'fee-1',
                areaCity: 'city-1',
                basicFee: new Decimal('100000'),
                billBasedTransportFee: [{
                    minBillValue: new Decimal('100')
                }],
                distanceFeePerKm: new Decimal('1000000'),
                transportOriginIds: [0, 1],
                isDeleted: false,
            })
        })
        describe('get bill based transport fee', async () => {
            it('Should succeed', async () => {
                context.request.query = {
                    city: 'city-1',
                    latitude: '10.0001',
                    longitude: '20.0001',
                }
                let endUserTransportView = myContainer.get<EndUserTransportFeeView>(TYPES.END_USER_TRANSPORT_FEE_VIEW)
                await endUserTransportView.fetchBillBasedTransportFee(context.request, context.response)
                sinon.assert.calledOnceWithExactly(context.statusSpy, 200)  
                sinon.assert.calledOnce(context.sendSpy)
                chai.expect(context.sendSpy.getCall(0).args[0]).to.eql([{
                    minBillValue: new Decimal('100')
                }])
            })
        })


        describe('get area transport fee', async () => {
            it('Should succeed', async () => {
                context.request.query = {
                    city: 'city-1',
                    latitude: '10.0001',
                    longitude: '20.0001',
                }
                let endUserTransportView = myContainer.get<EndUserTransportFeeView>(TYPES.END_USER_TRANSPORT_FEE_VIEW)
                await endUserTransportView.fetchAreaTransportFee(context.request, context.response)
                sinon.assert.calledOnceWithExactly(context.statusSpy, 200)  
                sinon.assert.calledOnce(context.sendSpy)
                chai.expect(context.sendSpy.getCall(0).args[0]).to.eql({
                    addressId: 0,
                    transportFee: new Decimal('100000')
                })
            })
        })
    })
})

describe('Transport fee controller test', async () => {
    describe('End user transport fee controller test', async () => {
        let controller: EndUserTransportFeeController
        beforeEach(() => {
            const mockAreaTransportFeeRepository = new MockAreaTransportFeeRepository()
            myContainer.rebind<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY).toConstantValue(mockAreaTransportFeeRepository)
        
            mockAreaTransportFeeRepository.fees.push({
                id: 0,
                name: 'fee-1',
                areaCity: 'city-1',
                basicFee: new Decimal('100000'),
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal('100000'),
                transportOriginIds: [0, 1],
                isDeleted: false,
            })

            mockAreaTransportFeeRepository.fees.push({
                id: 1,
                name: 'fee-1',
                areaCity: 'city-1',
                basicFee: new Decimal('110000'),
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal('100000'),
                transportOriginIds: [2],
                isDeleted: false,
            })


            mockAreaTransportFeeRepository.fees.push({
                id: 1,
                name: 'fee-2',
                areaCity: 'city-2',
                basicFee: new Decimal('200000'),
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal('100000'),
                transportOriginIds: [2],
                isDeleted: false,
            })

            mockAreaTransportFeeRepository.origins.push({
                id: 0,
                latitude: new Decimal('30.000001'),
                longitude: new Decimal('40.000001'),
                address: 'origin-1',
                city: 'city-2',
                isDeleted: false
            })
            mockAreaTransportFeeRepository.origins.push({
                id: 1,
                latitude: new Decimal('10.000001'),
                longitude: new Decimal('20.000001'),
                address: 'origin-2',
                city: 'city-2',
                isDeleted: false
            })
            mockAreaTransportFeeRepository.origins.push({
                id: 2,
                latitude: new Decimal('11.000001'),
                longitude: new Decimal('21.000001'),
                address: 'origin-3',
                city: 'city-3',
                isDeleted: false
            })
            controller = myContainer.get<EndUserTransportFeeController>(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER)
        })
        afterEach(() => {
            myContainer.rebind<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY).to(AreaTransportFeeRepositoryPostgres)
        })
        describe('test find transport fee for location', async () => {
            it('find best transport fee', async () => {
                let [transportFee, transportOrigin] = await controller.findBestTransportFee('city-1', new Decimal('10.0000001'), new Decimal('20.0000001'))
                chai.expect(transportFee.id).eql(0)
                chai.expect(transportOrigin!.id).eql(1)
            })
            it('find transport fee for city-2', async () => {
                let [transportFee, transportOrigin] = await controller.findBestTransportFee('city-2', new Decimal('10.0000001'), new Decimal('20.0000001'))
                chai.expect(transportFee.id).eql(1)
                chai.expect(transportOrigin!.id).eql(2)
            })
        })
    })
})
