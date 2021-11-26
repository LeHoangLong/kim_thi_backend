import { inject, injectable } from "inversify";
import { Address } from "../model/Address";
import { IAddressRepository } from "../repository/IAddressRepository";
import { TYPES } from "../types";

@injectable()
export class AdminAddressController {
    constructor(
        @inject(TYPES.ADDRESS_REPOSITORY) private repository: IAddressRepository
    ) {

    }

    async fetchAddressById(id: number): Promise<Address> {
        return this.repository.fetchAddressById(id)
    }
}