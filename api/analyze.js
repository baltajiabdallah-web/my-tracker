export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, type } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textContent = data.content[0].text;
    
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch[0]);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
