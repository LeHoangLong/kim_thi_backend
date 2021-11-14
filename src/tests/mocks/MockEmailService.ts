import { IEmailService } from "../../services/IEmailService";

export class MockEmailService implements IEmailService {
    public sentEmails: any[] = []
    async sendEmail(to: string, content: string, subject: string): Promise<boolean> {
        this.sentEmails.push({
            to: to,
            content: content,
            subject: subject,
        })
        return true
    }
}