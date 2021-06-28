export interface Product {
    id: string | null,
    name: string,
    isDeleted: boolean,
    avatarId: string,
    createdTimeStamp: Date,
    rank: number,
}