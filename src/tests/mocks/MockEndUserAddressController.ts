import Decimal from "decimal.js";
import { EndUserAddressController } from "../../controller/EndUserAddressController";
import { Address } from "../../model/Address";

export class MockEndUserAddressController extends EndUserAddressController {
    constructor() {
        super(null as any, null as any, null as any)
    }

    async createAddress(
        latitude: Decimal,
        longitude: Decimal,
    ) : Promise<Address> {
        return {
            id: 0,
            address: 'address',
            city: 'city',
            latitude: latitude,
            longitude: longitude,
            isDeleted: false,
        }
    }
}