const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
    const entry = body.entry && body.entry;
    const changes = entry && entry.changes && entry.changes;
    const value = changes && changes.value;
    const message = value && value.messages && value.messages;

    if (message && message.type === 'text') {
      const from = message.from;
      const text = message.text.body.trim();
      let replyText = "";

      if (text.toLowerCase().startsWith('song ')) {
        const songName = encodeURIComponent(text.slice(5));
        replyText = `🎵 *YouTube Music-ல் கேட்க:*\nhttps://youtube.com{songName}`;
      } else {
        const studyPrompt = `நீ ஒரு சிறந்த ஆசிரியர் (AI Study Tutor). மாணவர் கேட்கும் படிப்பு சம்பந்தப்பட்ட கேள்விகளுக்கு மிகத் தெளிவாகவும், எளிமையாகவும், படிப்படியாகவும் (Step-by-step) பதிலளி. கேள்வி தமிழில் இருந்தால் தமிழிலும், ஆங்கிலத்தில் இருந்தால் ஆங்கிலத்திலும் WhatsApp-ல் படிப்பதற்கு ஏற்ப சுருக்கமாகவும் தெளிவாகவும் பதில் தா. மாணவரின் கேள்வி: ${text}`;

        const aiRes = await axios.post(
          `https://googleapis.com{GEMINI_API_KEY}`,
          { contents: [{ parts: [{ text: studyPrompt }] }] }
        );
        replyText = aiRes.data.candidates.content.parts.text;
      }

      await axios.post(
        `https://facebook.com{PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: from,
          text: { body: replyText }
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

app.listen(PORT, () => console.log(`Study Bot running on port ${PORT}`));
