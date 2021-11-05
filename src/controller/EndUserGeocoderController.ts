import { inject, injectable } from "inversify";
import { UnsupportedCity } from "../exception/UnsupportedCity";
import { Address } from "../model/Address";
import { IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository";
import { IGeocoderService } from "../services/IGeocoderService";
import { TYPES } from "../types";

@injectable()
export class EndUserGeocoderController {
    constructor(
        @inject(TYPES.AREA_TRANSPORT_FEE_REPOSITORY) private transportRepository: IAreaTransportFeeRepository,
        @inject(TYPES.GEOCODER_SERVICE) private geocoderService: IGeocoderService
    ) {

    }

    // throw UnsupportedCity if we dont ship 
    async geocode(address: string) : Promise<Address> {
        let decodedAddress = await this.geocoderService.geocode(address)
        let isSupported = await this.transportRepository.isCitySupported(decodedAddress.city)
        if (!isSupported) {
            throw new UnsupportedCity(`${address} is not supported`)
        }
        return decodedAddress
    }
}