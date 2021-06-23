export class UnrecognizedEnumValue {
    constructor(
        public readonly value: number | string
    ) {}

    toString(): string {
        return 'Unrecognized value: ' + this.value;
    }
}