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
                    let words = address.split(' ')
                    let bestIndex = -1
                    let bestScore = 0
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].formattedAddress) {
                            let includedWord: Map<string, number> = new Map()
                            for (let j = 0; j < words.length; j++) {
                                if (!includedWord.has(words[j])) {
                                    let matches = data[i].formattedAddress?.match(words[j])
                                    if (matches) {
                                        includedWord.set(words[j], matches.length)
                                    } else {
                                        includedWord.set(words[j], 0)
                                    }
                                }
                            }
                            
                            let totalMatch = 0
                            for (let count of includedWord.values()) {
                                totalMatch += count
                            }

                            let formatedAddressWordCount = data[i].formattedAddress!.split(' ').length
                            let score = totalMatch / formatedAddressWordCount
                            if (score > bestScore || bestIndex == -1) {
                                bestIndex = i
                                bestScore = score
                            }
                        }
                    }

                    if (bestIndex > -1) {
                        let city : string | null = null
                        if (data[bestIndex].administrativeLevels?.level1short) {
                            city = data[bestIndex].administrativeLevels?.level1short!
                        } else if (data[bestIndex].administrativeLevels?.level1long) {
                            city = data[bestIndex].administrativeLevels?.level1long!
                        }

                        if (data[bestIndex].latitude && data[bestIndex].longitude && city) {
                            resolve({
                                id: -1,
                                latitude: new Decimal(data[bestIndex].latitude!),
                                longitude: new Decimal(data[bestIndex].longitude!),
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