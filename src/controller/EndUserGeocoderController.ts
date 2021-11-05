import { inject, injectable } from "inversify";
import { Address } from "../model/Address";
import { IGeocoderService } from "../services/IGeocoderService";
import { TYPES } from "../types";

@injectable()
export class EndUserGeocoderController {
    constructor(
        @inject(TYPES.GEOCODER_SERVICE) private geocoderService: IGeocoderService
    ) {

    }

    async geocode(address: string) : Promise<Address> {
        return this.geocoderService.geocode(address)
    }
}