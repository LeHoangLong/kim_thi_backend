"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnrecognizedEnumValue = void 0;
class UnrecognizedEnumValue {
    constructor(value) {
        this.value = value;
    }
    toString() {
        return 'Unrecognized value: ' + this.value;
    }
}
exports.UnrecognizedEnumValue = UnrecognizedEnumValue;
