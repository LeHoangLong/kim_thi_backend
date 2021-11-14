import { IEmailService } from "./IEmailService";
import { createTransport, Transporter } from 'nodemailer';
import { injectable } from "inversify";

@injectable()
export class EMailService implements IEmailService {
    private transporter: Transporter;
    private userEmail: string;
    constructor(service: string, userEmail: string, password: string) {
        this.transporter = createTransport({
            service: service,
            auth: {
                user: userEmail,
                pass: password,
            }
        })
        this.userEmail = userEmail;
    }

    async sendEmail(to: string, content: string, subject: string) : Promise<boolean> {
        await this.transporter.sendMail({
            from: this.userEmail,
            to: to,
            subject: subject,
            text: content,
        });
        return true;
    }
}