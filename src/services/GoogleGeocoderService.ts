import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import NodeGeocoder from "node-geocoder";
import { NotFound } from "../exception/NotFound";
import { Address } from "../model/Address";
import { TYPES } from "../types";
import { IGeocoderService } from "./IGeocoderService";

@injectable()
export class GoogleGeocoderService implements IGeocoderService {
    private geocoder : NodeGeocoder.Geocoder
    constructor(
        @inject(TYPES.GOOGLE_GEOCODER_OPTION) option: NodeGeocoder.GoogleOptions
    ) {
        this.geocoder = NodeGeocoder(option)
    }

    async geocode(address: string) : Promise<Address> {
        this.geocoder.geocode(address)
        return new Promise<Address>((resolve, reject) => {
            this.geocoder.geocode(address, (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    let found = false
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].latitude && data[i].longitude) {
                            resolve({
                                id: -1,
                                latitude: new Decimal(data[i].latitude!),
                                longitude: new Decimal(data[i].longitude!),
                                isDeleted: false,
                                address: address,
                            })
                            return;
                        }
                    }
                    reject(new NotFound('Address', 'address', address))
                }
            })
        })
    }
}