import { CustomerContact } from "../model/CustomerContact";

export interface ICustomerContactRepository {
    createCustomerContact(arg: {phoneNumber?: string, email?: string, name?: string}) : Promise<CustomerContact>
    // throw NotFound if no contact with phoneNumber
    findCustomerContactByPhoneNumber(phoneNumber: string): Promise<CustomerContact>
}