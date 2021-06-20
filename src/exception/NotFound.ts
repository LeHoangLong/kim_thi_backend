export class NotFound {
    constructor(
        public readonly modelName: string,
        public readonly keyName: string,
        public readonly keyValue: string,
    ) {}

    toString(): string {
        return `Model ${this.modelName} does not have item with field ${this.keyName} and value ${this.keyValue}`
    }
}