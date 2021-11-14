import Decimal from "decimal.js";
import { Address } from "../model/Address";

export interface IGeocoderService {
    geocode(address: string) : Promise<Address>
    reverseGeocode(latitude: Decimal, longitude: Decimal) : Promise<Address>
}