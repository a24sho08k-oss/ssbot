const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    const entry = body.entry && body.entry[0];
    const changes = entry && entry.changes && entry.changes[0];
    const value = changes && changes.value;
    const message = value && value.messages && value.messages[0];

    if (message && message.type === 'text') {
      const from = message.from;
      const text = message.text.body;

      await axios.post(
        `https://facebook.com{PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: from,
          text: { body: `வணக்கம்! நீங்கள் அனுப்பிய மெசேஜ்: "${text}"` }
        },
        { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
      );
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
