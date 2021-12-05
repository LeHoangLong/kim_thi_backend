import { IEmailService } from "./IEmailService";
import { createTransport, Transporter } from 'nodemailer';
import { inject, injectable } from "inversify";
import { gmail_v1, compute_v1, google } from 'googleapis'
import sgMail from '@sendgrid/mail'
import { TYPES } from "../types";

@injectable()
export class SendGridEmailService implements IEmailService {
    constructor(
        @inject(TYPES.SEND_GRID_API_KEY) apiKey: string,
        @inject(TYPES.SEND_GRID_SENDER_EMAIL) private from: string,
    ) {
        sgMail.setApiKey(apiKey)
    }

    async sendEmail(to: string, content: string, subject: string) : Promise<boolean> {
        await sgMail.send({
            to: to,
            subject: subject,
            text: content,
            from: this.from,
        })
        return true;
    }
}