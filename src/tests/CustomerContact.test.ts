import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { Address } from "../model/Address"
import { IAddressRepository } from "../repository/IAddressRepository"
import { IConnectionFactory } from "../services/IConnectionFactory"
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory"
import { TYPES } from "../types"
import chai from 'chai'
import { ICustomerContactRepository } from "../repository/ICustomerContactRepository"

describe('Test customer contact repository', async () => {
    describe('create customer contact', async () => {
        it('should succeed', async () => {
            let customerContactRepository = myContainer.get<ICustomerContactRepository>(TYPES.CUSTOMER_CONTACT_REPOSITORY)
            let customerContact = await customerContactRepository.createCustomerContact({phoneNumber: '+1234567', email: 'email@google.com'})
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
                is_deleted: false,
            })
        })
    })
})