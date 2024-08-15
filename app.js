const express = require("express");
const redis = require("redis");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cors = require('cors');
const bodyParser = require('body-parser');
const zlib = require('zlib');

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
const port = 3000;
app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/hello', async (req, res) => {
  res.send('Melo');
});

app.post('/set-object-chunked', async (req, res) => {
  const { key, chunk, index, total } = req.body;
  try {
    await client.rPush(`${key}:chunks`, chunk);
    
    if (index === total - 1) {
      // Last chunk received, combine all chunks
      const chunks = await client.lRange(`${key}:chunks`, 0, -1);
      const fullValue = chunks.join('');
      await client.set(key, fullValue);
      await client.del(`${key}:chunks`);
      res.send('Object set in Redis');
    } else {
      res.send('Chunk received');
    }
  } catch (error) {
    console.error('Error setting chunked object:', error);
    res.status(500).send('Error setting chunked object');
  }
});

app.post('/set-object-compressed', async (req, res) => {
  const { key, compressedValue } = req.body;
  try {
    const value = zlib.gunzipSync(Buffer.from(compressedValue, 'base64')).toString();
    await client.set(key, value);
    res.send('Compressed object set in Redis');
  } catch (error) {
    console.error('Error setting compressed object:', error);
    res.status(500).send('Error setting compressed object');
  }
});

app.get('/get-object-compressed/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const value = await client.get(key);
    if (value) {
      const compressedValue = zlib.gzipSync(value).toString('base64');
      res.json({ key, compressedValue });
    } else {
      res.json({ key, compressedValue: null });
    }
  } catch (error) {
    console.error('Error getting compressed object:', error);
    res.status(500).send('Error getting compressed object');
  }
});

app.post('/set', async (req, res) => {
  const { key, value } = req.body;
  await client.set(key, value);
  res.send('Value set in Redis');
});

app.get('/get/:key', async (req, res) => {
  const { key } = req.params;
  const value = await client.get(key);
  res.json({ key, value });
});

app.post('/set-object', async (req, res) => {
  const { key, value } = req.body;
  await client.set(key, JSON.stringify(value));
  res.send('Object set in Redis');
});


app.get('/get-object/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const value = await client.get(key);
    res.json({ key, value: JSON.parse(value) });
  } catch (error) {
    console.error('Error getting object:', error);
    res.status(500).send('Error getting object');
  }
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

app.post('/flush-cache', async (req, res) => {
  try {
    await client.flushAll();
    res.send('All Redis cache has been successfully deleted');
  } catch (error) {
    console.error('Error flushing Redis cache:', error);
    res.status(500).send('Error flushing Redis cache');
  }
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

const base64ToUnicode = (str) => {
  return decodeURIComponent(atob(str).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
};
async function sendEmailWithAttachment(to, subject, text, attachmentContent, fileName) {
  const decodedContent = base64ToUnicode(attachmentContent);
  const mailOptions = {
    from: "smartmssa.jira.report.sender@gmail.com",
    to: to,
    subject: subject,
    text: text,
    attachments: [
      {
        filename: fileName,
        content: Buffer.from(decodedContent),
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
