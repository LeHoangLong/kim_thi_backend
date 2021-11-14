import { CustomerContact } from "../model/CustomerContact";

export interface ICustomerContactRepository {
    createCustomerContact(arg: {phoneNumber?: string, email?: string}) : Promise<CustomerContact>
}