import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { GoogleGeocoderService } from "../services/GoogleGeocoderService"
import { TYPES } from "../types"
import chai from 'chai'
import { IGeocoderService } from "../services/IGeocoderService"
import { inject } from "inversify"
import { EndUserGeocodingView } from "../view/EndUserGeocodingVIew"
import sinon from "sinon"
import { MockGeocodingService } from "./mocks/MockGeocoderService"

describe('Google geocoding test', async function() {
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
})

describe('Geocoding view test', async function name() {
    let context: any = {}
    this.beforeEach(() => {
        let request: any = {}
        let response: any = {
            status() : any {
                return this
            },
            send() : any {

            },
        }

        myContainer.rebind<IGeocoderService>(TYPES.GEOCODER_SERVICE).to(MockGeocodingService)
        
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
})