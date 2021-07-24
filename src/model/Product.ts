export interface Product {
    id: number | null,
    serialNumber: string,
    name: string,
    isDeleted: boolean,
    avatarId: string,
    createdTimeStamp: Date | null,
    rank: number, // rank is to indicate which product to prioritize for showing
}