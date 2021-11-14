
import { Transporter, SendMailOptions } from 'nodemailer';
import sinon, { stub } from 'sinon';
import { EMailService } from '../../src/services/EmailService';

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