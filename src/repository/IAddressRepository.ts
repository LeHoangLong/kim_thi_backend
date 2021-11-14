import Decimal from "decimal.js";
import { Address } from "../model/Address";

export interface IAddressRepository {
    createAddress(address: string, latitude: Decimal, longitude: Decimal, city: string): Promise<Address>
}