import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { GoogleGeocoderService } from "../services/GoogleGeocoderService"
import { TYPES } from "../types"
import chai from 'chai'

describe('Google geocoding test', async function() {
    it('Should give correct address', async function name() {
        let googleGeocoder = new GoogleGeocoderService(myContainer.get(TYPES.GOOGLE_GEOCODER_OPTION))
        let address = await googleGeocoder.geocode('86 Gia Phú phường 1 quận 6')
        chai.expect(address.latitude).to.eql(new Decimal('10.7474205'))
        chai.expect(address.longitude).to.eql(new Decimal('106.6539246'))
    })
})