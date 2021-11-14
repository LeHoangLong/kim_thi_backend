export class UnrecognizedEnumValue implements Error {
    public readonly name: string = 'UnrecognizedEnumValue'
    public readonly message: string
    constructor(
        public readonly value: number | string
    ) {
        this.message = 'Unrecognized enum value: ' + this.value
    }
}