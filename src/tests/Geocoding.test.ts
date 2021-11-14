import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { GoogleGeocoderService } from "../services/GoogleGeocoderService"
import { TYPES } from "../types"
import chai from 'chai'
import { IGeocoderService } from "../services/IGeocoderService"
import { EndUserGeocodingView } from "../view/EndUserGeocodingVIew"
import sinon from "sinon"
import { MockGeocodingService } from "./mocks/MockGeocoderService"
import { IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository"
import { MockAreaTransportFeeRepository } from "./mocks/MockAreaTransportFeeRepository"

if (process.env.FULL_TEST) {
    describe('Google geocoding test', async function() {
        describe('forward geocode', async () => {
            it('Should give correct address', async function name() {
                let googleGeocoder = myContainer.get<IGeocoderService>(TYPES.GEOCODER_SERVICE)
                let address = await googleGeocoder.geocode('86 Gia Phú phường 1 quận 6')
                chai.expect(address.latitude).to.eql(new Decimal('10.7474205'))
                chai.expect(address.longitude).to.eql(new Decimal('106.6539246'))
                chai.expect(address.city).to.eql('Thành phố Hồ Chí Minh')
            })

            it('Should give correct city', async function name() {
                let googleGeocoder = myContainer.get<IGeocoderService>(TYPES.GEOCODER_SERVICE)
                let address = await googleGeocoder.geocode('Thành phố Hồ Chí Minh')
                chai.expect(address.latitude).to.eql(new Decimal('10.8230989'))
                chai.expect(address.longitude).to.eql(new Decimal('106.6296638'))
                chai.expect(address.city).to.eql('Thành phố Hồ Chí Minh')
            })



            it('Should give correct city with short name', async function name() {
                let googleGeocoder = myContainer.get<IGeocoderService>(TYPES.GEOCODER_SERVICE)
                let address = await googleGeocoder.geocode('Hồ Chí Minh')
                chai.expect(address.city).to.eql('Thành phố Hồ Chí Minh')

                address = await googleGeocoder.geocode('TPHCM')
                chai.expect(address.city).to.eql('Thành phố Hồ Chí Minh')
            })
        })

        describe('reverse geocode', async () => {
            it('should succed', async () => {
                let googleGeocoder = myContainer.get<IGeocoderService>(TYPES.GEOCODER_SERVICE)
                let address = await googleGeocoder.reverseGeocode(new Decimal('10.7474205'), new Decimal('106.6539246'))
                chai.expect(address.latitude).to.eql(new Decimal('10.7474205'))
                chai.expect(address.longitude).to.eql(new Decimal('106.6539246'))
                chai.expect(address.city).to.eql('Thành phố Hồ Chí Minh')
                chai.expect(address.address).to.eql('86 Đường Gia Phú, Phường 1, Quận 5, Thành phố Hồ Chí Minh, Việt Nam')
                chai.expect(address.isDeleted).to.eql(false)
            })
        })
    })

    describe('Geocoding view test', async function name() {
        let context: any = {}
        let mockAreaTransportFee: MockAreaTransportFeeRepository
        let mockGeocodingService: MockGeocodingService

        this.beforeEach(() => {
            let request: any = {}
            let response: any = {
                status() : any {
                    return this
                },
                send() : any {

                },
            }

            mockAreaTransportFee = new MockAreaTransportFeeRepository()
            mockGeocodingService = new MockGeocodingService()

            myContainer.rebind<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY).toConstantValue(mockAreaTransportFee)
            myContainer.rebind<IGeocoderService>(TYPES.GEOCODER_SERVICE).toConstantValue(mockGeocodingService)
            
            context.request = request
            context.response = response
            context.statusSpy = sinon.spy(context.response, "status")
            context.sendSpy = sinon.spy(context.response, "send")
        })
        afterEach(() => {
            myContainer.rebind<IGeocoderService>(TYPES.GEOCODER_SERVICE).to(GoogleGeocoderService)
        })
        it('Should return with correct format', async function () {
            let view = myContainer.get<EndUserGeocodingView>(TYPES.END_USER_GEOCODER_VIEW)
            context.request.body = {
                address: 'test-address'
            }
            await view.geocode(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
            sinon.assert.calledOnce(context.sendSpy)
            chai.expect(context.sendSpy.getCall(0).args[0]).to.eql({
                latitude: '10.000001',
                longitude: '20.000001',
                city: 'test-city',
            })
        })

        it('Should return 404 if city not supported', async function() {
            mockGeocodingService.city = 'unsupported-city-address'
            mockAreaTransportFee.unsupportedCities.push('unsupported-city-address')
            let view = myContainer.get<EndUserGeocodingView>(TYPES.END_USER_GEOCODER_VIEW)
            context.request.body = {
                address: 'unsupported-city-address'
            }
            await view.geocode(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 404)
            sinon.assert.calledOnce(context.sendSpy)
        })
    })
}