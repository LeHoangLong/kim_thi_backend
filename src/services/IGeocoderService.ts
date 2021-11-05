import { Address } from "../model/Address";

export interface IGeocoderService {
    geocode(address: string) : Promise<Address>
}