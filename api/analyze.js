export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, type } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let prompt = '';

  if (type === 'food') {
    prompt = `Analyse ce repas et estime UNIQUEMENT les calories totales. Réponds UNIQUEMENT avec ce format JSON, rien d'autre:
{"calories": NUMBER}

Repas: "${text}"`;
  } else if (type === 'exercise') {
    prompt = `Analyse cet exercice et estime les calories brûlées. Si la personne donne un chiffre, utilise-le. Réponds UNIQUEMENT avec ce format JSON:
{"calories": NUMBER}

Activité: "${text}"`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ error: error.error?.message || 'OpenAI error' });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    const textContent = data.choices[0].message.content.trim();
    
    try {
      const result = JSON.parse(textContent);
      if (!result.calories) {
        return res.status(500).json({ error: 'No calories in response' });
      }
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON: ' + textContent });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
