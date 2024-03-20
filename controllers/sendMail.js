const nodemailer = require('nodemailer');


async function sendMail(userEmail, Title, Content) {
    try {
        let transporter = await nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: 'smartwalletmailer11042022@gmail.com',
                pass: 'iurx gixl rngc dhfh'
            }
        });

        let mailOptions = {
            from: 'smartwalletmailer11042022@gmail.com',
            to: userEmail,
            subject: Title,
            text: Content
        };

        transporter.sendMail(mailOptions, (error, info) => {

            if (error) {
                console.log("Send mail error:" + error.message);
            } else {
                console.log('Email sent: ' + info.response);
            }

        })

    } catch (error) {
        console.log("Send mail fail.");
    }
}

module.exports = { sendMail }