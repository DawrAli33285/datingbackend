const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // e.g. smtp.gmail.com
    port: process.env.SMTP_PORT,       // e.g. 587
    secure: false,                     // true for port 465
    auth: {
      user: process.env.SMTP_EMAIL,     // your email address
      pass: process.env.SMTP_PASSWORD,     // your email password or app password
    },
  });

  await transporter.sendMail({
    from: `"MyApp" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;