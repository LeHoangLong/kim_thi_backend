import Decimal from 'decimal.js'

export interface Address {
    id: number,
    address: string,
    latitude: Decimal,
    longitude: Decimal,
    isDeleted: boolean,
}