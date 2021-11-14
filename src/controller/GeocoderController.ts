import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { Address } from "../model/Address";
import { IGeocoderService } from "../services/IGeocoderService";
import { TYPES } from "../types";

@injectable()
export class GeocoderController {
    constructor(
        @inject(TYPES.GEOCODER_SERVICE) private geocoderService: IGeocoderService
    ) {

    }

    async geocode(address: string) : Promise<Address> {
        return this.geocoderService.geocode(address)
    }

    async reverseGeocode(iLatitude: Decimal, iLongitude: Decimal) : Promise<Address> {
        let decodedAddress = await this.geocoderService.reverseGeocode(iLatitude, iLongitude)
        return decodedAddress
    }
}