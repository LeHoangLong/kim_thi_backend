export enum EProductUnit {
    KG = 0
}

export interface ProductPrice {
    id: number | null,
    unit: EProductUnit,
    minQuantity: number,
    price: number,
    isDeleted: boolean,
}