export interface IEmailService {
    sendEmail(to: string, content: string, subject: string) : Promise<boolean>;
}