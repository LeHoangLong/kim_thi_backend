export class IncorrectValue implements Error {
    public readonly name: string = 'IncorrectValue'
    constructor(
        public readonly message: string
    ) {

    }
}