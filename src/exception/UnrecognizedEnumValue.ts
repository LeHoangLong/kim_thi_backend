export class UnrecognizedEnumValue {
    constructor(
        public readonly value: number
    ) {}

    toString(): string {
        return 'Unrecognized value: ' + this.value;
    }
}