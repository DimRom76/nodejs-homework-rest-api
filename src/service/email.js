const sgMail = require("@sendgrid/mail");
const Mailgen = require("mailgen");
require("dotenv").config();

class EmailService {
  #sender = sgMail;
  #GenerateTemplate = Mailgen;
  #createTemplate(verifyToken, host) {
    const mailGenerator = new this.#GenerateTemplate({
      theme: "default",
      product: {
        name: "System Contacts",
        link: host,
      },
    });

    const email = {
      body: {
        name: "Dear friend",
        intro:
          "Welcome to System Contacts! We're very excited to have you on board.",
        action: {
          instructions:
            "To get started with System Contacts, please click here:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Confirm your account",
            link: `${host}api/users/verify/${verifyToken}`,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
    var emailBody = mailGenerator.generate(email);
    return emailBody;
  }

  async sendEmail(verifyToken, email) {
    const host = "http://127.0.0.1:3000/";
    const emailBody = this.#createTemplate(verifyToken, host);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email, // Change to your recipient
      from: "dimaweb@rambler.ru", // Change to your verified sender
      subject: "Sending with SendGrid is Fun",
      html: emailBody,
    };

    await this.#sender.send(msg);
  }
}

module.exports = EmailService;
