export class DuplicateResource {
    constructor(
        public readonly modelName: string,
        public readonly keyName: string,
        public readonly keyValue: string,
    ) {}

    toString(): string {
        return `Model ${this.modelName} already have items with field ${this.keyName} and value ${this.keyValue}`
    }
}