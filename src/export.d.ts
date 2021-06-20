declare module "kim__thi" {
    export class UserRepositoryPostgres {
        createUser(username: string, password: string, permissions: Permission[]): Promise<User>
    }
}