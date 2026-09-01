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
    prompt = `Analyse ce repas et estime UNIQUEMENT les calories totales.
Réponse en JSON: {"calories": NUMBER}

Repas: "${text}"`;
  } else if (type === 'exercise') {
    prompt = `Analyse cet exercice et estime les calories brûlées.
Si la personne donne un chiffre (ex: "j'ai brûlé 420 kcal"), utilise CE chiffre.
Sinon, estime basé sur le type d'activité.
Réponse en JSON: {"calories": NUMBER}

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
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();
    const textContent = data.choices[0].message.content;
    
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch[0]);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
