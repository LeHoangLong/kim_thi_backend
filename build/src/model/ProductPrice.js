"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EProductUnitToString = exports.stringToEProductUnit = exports.EProductUnit = void 0;
const UnrecognizedEnumValue_1 = require("../exception/UnrecognizedEnumValue");
var EProductUnit;
(function (EProductUnit) {
    EProductUnit[EProductUnit["KG"] = 0] = "KG";
})(EProductUnit = exports.EProductUnit || (exports.EProductUnit = {}));
function stringToEProductUnit(unitStr) {
    unitStr = unitStr.toUpperCase();
    let unit;
    switch (unitStr) {
        case "KG":
            unit = EProductUnit.KG;
            break;
        default:
            throw new UnrecognizedEnumValue_1.UnrecognizedEnumValue(unitStr);
    }
    return unit;
}
exports.stringToEProductUnit = stringToEProductUnit;
function EProductUnitToString(unit) {
    switch (unit) {
        case EProductUnit.KG:
            return "KG";
    }
}
exports.EProductUnitToString = EProductUnitToString;
