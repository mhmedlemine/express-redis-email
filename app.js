const express = require("express");
const redis = require("redis");
const nodemailer = require("nodemailer");
const fs = require("fs");

const app = express();
const port = 3000;
app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.post('/set', async (req, res) => {
  const { key, value } = req.body;
  await client.set(key, value);
  res.send('Value set in Redis');
});

app.get('/hello', async (req, res) => {
  res.send('Melo');
});

app.get('/get/:key', async (req, res) => {
  const { key } = req.params;
  const value = await client.get(key);
  res.json({ key, value });
});

app.post('/send-email', async (req, res) => {
  const { to, subject, text, attachmentPath, fileName } = req.body;
  await sendEmailWithAttachment(to, subject, text, attachmentPath, fileName);
  res.send('Email sent');
});

const client = redis.createClient({
  url: "redis://red-cqp4jpbqf0us73e41un0:6379",
});
client.on("error", (err) => console.log("Redis Client Error", err));

async function connectRedis() {
  await client.connect();
}
connectRedis();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "smartmssa.jira.report.sender@gmail.com",
    pass: "zehj gohf nqer foug",
  },
});

async function sendEmailWithAttachment(to, subject, text, attachmentPath, fileName) {
  const mailOptions = {
    from: "smartmssa.jira.report.sender@gmail.com",
    to: to,
    subject: subject,
    text: text,
    attachments: [
      {
        filename: fileName,
        content: fs.createReadStream(attachmentPath),
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = app;
