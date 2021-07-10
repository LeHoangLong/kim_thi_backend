export interface Product {
    id: number | null,
    serialNumber: string,
    name: string,
    isDeleted: boolean,
    avatarId: string,
    createdTimeStamp: Date,
    rank: number,
}