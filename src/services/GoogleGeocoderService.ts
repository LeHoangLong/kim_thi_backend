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
                    for (let i = 0; i < data.length; i++) {
                        let city : string | null = null
                        if (data[i].administrativeLevels?.level1short) {
                            city = data[i].administrativeLevels?.level1short!
                        } else if (data[i].administrativeLevels?.level1long) {
                            city = data[i].administrativeLevels?.level1long!
                        }
                        if (data[i].latitude && data[i].longitude && city) {
                            resolve({
                                id: -1,
                                latitude: new Decimal(data[i].latitude!),
                                longitude: new Decimal(data[i].longitude!),
                                city: city,
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