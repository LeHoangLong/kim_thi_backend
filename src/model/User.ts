import { Permission } from "./Permission";

export class User {
    constructor(
        public id: number | null,
        public username: string,
        public password: string,
        public isDeactivated: boolean,
        public isVerified: boolean,
        public permissions: Permission[]
    ){};
}