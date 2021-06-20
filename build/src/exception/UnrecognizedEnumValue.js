"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnrecognizedEnumValue = void 0;
var UnrecognizedEnumValue = /** @class */ (function () {
    function UnrecognizedEnumValue(value) {
        this.value = value;
    }
    UnrecognizedEnumValue.prototype.toString = function () {
        return 'Unrecognized value: ' + this.value;
    };
    return UnrecognizedEnumValue;
}());
exports.UnrecognizedEnumValue = UnrecognizedEnumValue;
