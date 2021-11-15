import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { Address } from "../model/Address"
import { IAddressRepository } from "../repository/IAddressRepository"
import { IConnectionFactory } from "../services/IConnectionFactory"
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory"
import { TYPES } from "../types"
import chai from 'chai'
import { ICustomerContactRepository } from "../repository/ICustomerContactRepository"
import { CustomerContact } from "../model/CustomerContact"
import { NotFound } from "../exception/NotFound"
import { DuplicateResource } from "../exception/DuplicateResource"

describe('Test customer contact repository', async () => {
    let customerContactRepository: ICustomerContactRepository
    beforeEach(() => {
        customerContactRepository = myContainer.get<ICustomerContactRepository>(TYPES.CUSTOMER_CONTACT_REPOSITORY)
    })

    describe('create customer contact', async () => {
        it('should succeed', async () => {
            let customerContact = await customerContactRepository.createCustomerContact({
                phoneNumber: '+1234567', 
                email: 'email@google.com',
            })
            let connectionFactory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
            let fetchedContact: any
            await connectionFactory.getConnection(this, async (connection) => {
                let response = await connection.query(`
                    SELECT * FROM "customer_contact" WHERE id = ${customerContact.id}
                `)

                fetchedContact = response.rows[0]
            })

            chai.expect(customerContact).to.eql({
                id: customerContact.id,
                phoneNumber: '+1234567',
                email: 'email@google.com',
                isDeleted: false,
            })

            chai.expect(fetchedContact!).to.eql({
                id: customerContact.id,
                phone_number: '+1234567',
                email: 'email@google.com',
                name: null,
                is_deleted: false,
            })
        })

        it('should throw DuplicateResource', async () => {
            await customerContactRepository.createCustomerContact({
                phoneNumber: '+1234567', 
            })
            
            let exceptionThrow = false
            try {
                await customerContactRepository.createCustomerContact({
                    phoneNumber: '+1234567', 
                })
            } catch (exception) {
                chai.expect(exception).to.be.instanceOf(DuplicateResource)
                exceptionThrow = true
            }

            chai.expect(exceptionThrow).to.be.eql(true)
        })
    })

    describe('fetch customer contact', async () => {
        let customerContact : CustomerContact
        beforeEach(async () => {
            customerContact = await customerContactRepository.createCustomerContact({
                phoneNumber: '12345'
            })
        })

        it('should succeed', async () => {
            let contact = await customerContactRepository.findCustomerContactByPhoneNumber('12345')
            chai.expect(contact.phoneNumber).to.eql('12345')
            chai.expect(contact.id).to.eql(customerContact.id)
        })

        it('should throw NotFound', async () => {
            let exceptionThrow = false
            try {
                await customerContactRepository.findCustomerContactByPhoneNumber('12346')
            } catch (exception) {
                chai.expect(exception).to.be.instanceOf(NotFound)
                exceptionThrow = true
            }
            chai.expect(exceptionThrow).to.eql(true)
        })
    })
})