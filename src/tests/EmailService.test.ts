
import { Transporter, SendMailOptions } from 'nodemailer';
import sinon, { stub } from 'sinon';
import { EMailService } from '../../src/services/EmailService';
import { SendGridEmailService } from '../services/SendGridEmailService';
import chai from 'chai'

const nodemailer = require('nodemailer');

describe('Email service', () => {
    it('can send email', async function() {
        var stub = {
            sendMail: function(options: SendMailOptions) {}
        }
        const stubSendMail = sinon.stub(stub, "sendMail");
        sinon.stub(nodemailer, "createTransport").returns(stub as Transporter)
        let emailService = new EMailService("test service", "testemail", "testpassword"); 
        emailService.sendEmail("to", "content", "subject");
        sinon.assert.calledOnceWithExactly(stubSendMail, {
            from: "testemail",
            to: "to",
            text: "content",
            subject: "subject",
        });
    });
});


describe('Sendgrid email service', () => {
    it('can send email', async function() {
        this.timeout(5000);
        let emailService = new SendGridEmailService(process.env.SENDGRID_API_KEY!, 'erenjeager212121@gmail.com')
        let ret = await emailService.sendEmail('le.hoang.long@outlook.com', 'test-email', 'test-subject');
        chai.expect(ret).to.eql(true)
    });
});