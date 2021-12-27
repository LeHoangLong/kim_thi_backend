export interface Product {
    id: number | null,
    serialNumber: string,
    description: string,
    name: string,
    isDeleted: boolean,
    avatarId: string,
    createdTimeStamp: Date | null,
    rank: number, // rank is to indicate which product to prioritize for showing
    wholesalePrices: string[],
}