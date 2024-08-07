const express = require("express");
const redis = require("redis");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cors = require('cors');

const app = express();
app.use(cors());
const port = 3000;
app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/hello', async (req, res) => {
  res.send('Melo');
});

app.post('/set', async (req, res) => {
  const { key, value } = req.body;
  await client.set(key, value);
  res.send('Value set in Redis');
});

app.post('/set-object', async (req, res) => {
  const { key, value } = req.body;
  await client.set(key, JSON.stringify(value));
  res.send('Object set in Redis');
});

app.get('/get/:key', async (req, res) => {
  const { key } = req.params;
  const value = await client.get(key);
  res.json({ key, value });
});

app.get('/get-object/:key', async (req, res) => {
  const { key } = req.params;
  const value = await client.get(key);
  res.json({ key, value: JSON.parse(value) });
});

app.post('/set-array', async (req, res) => {
  const { key, value } = req.body;
  await client.rPush(key, value.map(JSON.stringify));
  res.send('Array set in Redis');
});

app.get('/get-array/:key', async (req, res) => {
  const { key } = req.params;
  const values = await client.lRange(key, 0, -1);
  res.json({ key, value: values.map(JSON.parse) });
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
