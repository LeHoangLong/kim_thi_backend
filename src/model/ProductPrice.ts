import { UnrecognizedEnumValue } from "../exception/UnrecognizedEnumValue";

export enum EProductUnit {
    KG = 0,
}

export interface PriceLevel {
    minQuantity: number,
    price: number,
}
export interface ProductPrice {
    id: number | null,
    unit: EProductUnit,
    defaultPrice: number,
    isDeleted: boolean,
    priceLevels: PriceLevel[],
    isDefault: boolean,
}

export function stringToEProductUnit(unitStr: string) {
    unitStr = unitStr.toUpperCase()
    let unit: EProductUnit;
    switch (unitStr) {
        case "KG":
            unit = EProductUnit.KG
            break;
        default:
            throw new UnrecognizedEnumValue(unitStr);
    }
    return unit
}

export function EProductUnitToString(unit: EProductUnit) {
    switch (unit) {
        case EProductUnit.KG:
            return "KG"
    }
}
