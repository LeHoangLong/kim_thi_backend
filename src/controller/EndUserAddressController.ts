import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { Address } from "../model/Address";
import { IAddressRepository } from "../repository/IAddressRepository";
import { IConnectionFactory } from "../services/IConnectionFactory";
import { TYPES } from "../types";
import { EndUserGeocoderController } from "./EndUserGeocoderController";

@injectable()
export class EndUserAddressController {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: IConnectionFactory,
        @inject(TYPES.ADDRESS_REPOSITORY) private addressRepository: IAddressRepository,
        @inject(TYPES.END_USER_GEOCODER_CONTROLLER) private geocoderController: EndUserGeocoderController,
    ) {

    }

    async createAddress(
        latitude: Decimal,
        longitude: Decimal,
    ) : Promise<Address> {
        let address = await this.geocoderController.reverseGeocode(latitude, longitude)
        await this.connectionFactory.startTransaction(this, [this.addressRepository], async () => {
            address = await this.addressRepository.createAddress(address.address, address.latitude, address.longitude, address.city)
        })
        return address
    }
}