require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
    console.log('Testing SMTP connection...');
    console.log('User:', process.env.SMTP_EMAIL);
    console.log('Pass:', process.env.SMTP_PASSWORD ? '******' : 'MISSING');

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_EMAIL, // Send to self
            subject: "Test SMTP ✔",
            text: "Si vous recevez ceci, c'est que la configuration SMTP est correcte !",
            html: "<b>Si vous recevez ceci, c'est que la configuration SMTP est correcte !</b>",
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Error sending mail:", error);
    }
}

main().catch(console.error);
