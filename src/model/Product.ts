
export function clone(product: Product) : Product {
    return {
        id: product.id,
        name: product.name,
        isDeleted: product.isDeleted,
        avatarId: product.avatarId,
        displayPriceId: product.displayPriceId,
        createdTimeStamp: product.createdTimeStamp,
        rank: product.rank,           
    }
    
}

export interface Product {
    id: string | null,
    name: string,
    isDeleted: boolean,
    avatarId: string,
    displayPriceId: number,
    createdTimeStamp: Date,
    rank: number,
}