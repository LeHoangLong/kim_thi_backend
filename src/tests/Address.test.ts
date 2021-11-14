import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { Address } from "../model/Address"
import { IAddressRepository } from "../repository/IAddressRepository"
import { IConnectionFactory } from "../services/IConnectionFactory"
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory"
import { TYPES } from "../types"
import chai from 'chai'

describe('Test address repository', async () => {
    describe('create address', async () => {
        it('should succeed', async () => {
            let addressRepostory = myContainer.get<IAddressRepository>(TYPES.ADDRESS_REPOSITORY)
            let address = await addressRepostory.createAddress('address-1', new Decimal('100.000001'), new Decimal('200.000002'), 'city-1')
            let connectionFactory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
            let fetchedAddress: Address
            await connectionFactory.getConnection(this, async (connection) => {
                let response = await connection.query(`
                    SELECT * FROM "address" WHERE id = ${address.id}
                `)

                fetchedAddress = response.rows[0]
            })

            chai.expect(address).to.eql({
                id: address.id,
                address: 'address-1',
                latitude: new Decimal('100.000001'),
                longitude: new Decimal('200.000002'),
                city: 'city-1',
                isDeleted: false,
            })

            chai.expect(fetchedAddress!).to.eql({
                id: address.id,
                address: 'address-1',
                latitude: '100.000001',
                longitude: '200.000002',
                city: 'city-1',
                is_deleted: false,
            })
        })
    })
})