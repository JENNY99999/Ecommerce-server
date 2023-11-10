const nodeMailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data, req, res) => {
  let transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_ID,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Hey " <abc@gmail.com>',
    to: data.to,
    subject: data.subject,
    text: data.text,
    html: data.html,
  });

  // console.log("Message sent: %s", info.messageId);
  // console.log("Preview URL: %s", nodeMailer.getTestMessageUrl(info));
});

module.exports = sendEmail;
