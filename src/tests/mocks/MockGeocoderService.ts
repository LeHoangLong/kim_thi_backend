import Decimal from "decimal.js";
import { injectable } from "inversify";
import { BatchResult, Entry, Geocoder, Location, Query } from "node-geocoder";
import { GeocoderController } from "../../controller/GeocoderController";
import { Address } from "../../model/Address";
import { IGeocoderService } from '../../services/IGeocoderService'

@injectable()
export class MockGeocodingService implements IGeocoderService {
    public city: string = 'test-city'
    async geocode(address: string) : Promise<Address> {
        return {
            id: -1,
            address: address,
            isDeleted: false,
            city: this.city,
            latitude: new Decimal('10.000001'),
            longitude: new Decimal('20.000001'),
        }
    }
}