// LabMate — serverless API route (Vercel)
// Calls OpenAI to generate a structured chemistry lab report.
// The API key stays on the server (OPENAI_API_KEY env var) — never exposed to users.

const SYSTEM_PROMPT = `You are LabMate, an expert chemistry lab report writer for undergraduate (BSc Honours) chemistry students.

The student will give you rough notes about an experiment: title, aim, chemicals, apparatus, rough procedure, and observations/readings.

Your job: turn these rough notes into a clean, well-structured lab report draft in Markdown with EXACTLY these sections (use ## headings):

## Aim
## Theory
## Apparatus and Reagents
## Procedure
## Observations
## Calculations
## Result
## Precautions
## Sources of Error
## Conclusion

Rules:
1. Procedure must be written in past tense, passive voice (standard scientific style). Example: "The solution was titrated against..."
2. Observations: if the student gave readings, present them in a clean Markdown table.
3. Calculations: show step-by-step working using the student's actual numbers. If a needed value is missing, insert a clear placeholder like **[ADD: molarity of NaOH]** instead of inventing data.
4. Theory: brief and relevant (4-8 sentences), include balanced chemical equations where applicable.
5. NEVER invent experimental readings or results. Only use what the student provided. Placeholders for anything missing.
6. Keep language clear and simple. This is a draft for the student to review and edit, not to submit blindly.
7. Precautions and Sources of Error: 4-6 practical, experiment-specific points each.
8. At the very end add a one-line italic note: *This is an AI-generated draft. Verify all values and calculations before submission.*`;

export default async function handler(req, res) {
  // Basic CORS + method guard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server is not configured. Set the OPENAI_API_KEY environment variable in Vercel.',
    });
  }

  try {
    const {
      title = '',
      aim = '',
      chemicals = '',
      apparatus = '',
      procedure = '',
      observations = '',
      notes = '',
    } = req.body || {};

    if (!title.trim() || !procedure.trim()) {
      return res.status(400).json({
        error: 'Please provide at least the experiment title and rough procedure notes.',
      });
    }

    const userPrompt = `Experiment title: ${title}

Aim (student's words, may be empty): ${aim || '(not given — write a suitable aim)'}

Chemicals / reagents: ${chemicals || '(not given — infer the obvious ones, mark uncertain ones with [VERIFY])'}

Apparatus: ${apparatus || '(not given — list standard apparatus for this experiment, mark with [VERIFY])'}

Rough procedure notes from the student:
${procedure}

Observations / readings from the student:
${observations || '(none given — create an empty observation table with placeholder rows like [reading 1])'}

Extra notes: ${notes || '(none)'}

Now write the full lab report draft following all the rules.`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errText);
      if (openaiRes.status === 401) {
        return res.status(502).json({ error: 'Invalid API key. Check OPENAI_API_KEY in Vercel settings.' });
      }
      if (openaiRes.status === 429) {
        return res.status(502).json({ error: 'Rate limit or no credit on the OpenAI account. Add credit at platform.openai.com/billing.' });
      }
      return res.status(502).json({
        error: 'The AI service returned an error. Please try again in a moment.',
      });
    }

    const data = await openaiRes.json();
    const report = data?.choices?.[0]?.message?.content || '';

    if (!report.trim()) {
      return res.status(502).json({ error: 'Empty response from AI. Please try again.' });
    }

    return res.status(200).json({ report });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
