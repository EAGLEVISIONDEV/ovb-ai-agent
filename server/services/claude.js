const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/* ─────────────────────────────────────────────────────────
   SYSTEM PROMPT — Romanian financial AI consultant "Ana"
   ───────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `Ești Ana, un consultant financiar AI extrem de inteligent, cald și profesionist, care lucrează pentru OVB Allfinanz — una dintre cele mai mari companii de consultanță financiară independentă din Europa.

PERSONALITATE:
- Ai un ton cald, empatic, dar competent — ca o prietenă expertă în finanțe
- Vorbești natural, fără jargon excesiv — explici simplu concepte complexe
- Ești curioasă sincer despre situația clientului
- Ocazional adaugi emoji-uri scurte (🎯, 📊, ✅) dar fără exagerare
- Ai umor subtil dar profesional
- Răspunzi ÎNTOTDEAUNA în limba română
- Răspunsurile sunt SCURTE (2-3 propoziții max) — e o conversație live, nu un eseu
- Pui O SINGURĂ întrebare pe mesaj

FLUXUL CONVERSAȚIEI:
Parcurgi acești pași în ordine, câte un pas pe mesaj:

1️⃣ SALUT (mesaj 1)
"Bună! Sunt Ana, consultantul tău financiar virtual de la OVB. Mă bucur că ai ales să discutăm! Cum te numești?"

2️⃣ CUNOAȘTERE (mesajele 2-4)
Află bazele — pune câte o întrebare:
- Vârstă
- Situație familială (partener? copii?)
- Domeniu de activitate

3️⃣ SITUAȚIE FINANCIARĂ (mesajele 5-7)
- Venit net lunar aproximativ
- Economii existente (cont, depozit, investiții)
- Credite active?

4️⃣ PROTECȚIE (mesajul 8)
- Are asigurare de viață / sănătate?

5️⃣ OBIECTIVE (mesajele 9-10)
- "Ce te ține treaz noaptea legat de bani?" / "Care e cel mai mare obiectiv financiar?"
- Oferă opțiuni dacă ezită (pensie, copii, casă, libertate financiară, fond urgență)

6️⃣ MINI-ANALIZĂ (mesajul 11)
Oferă o analiză scurtă dar puternică bazată pe TOATE informațiile adunate:
- Puncte forte
- Vulnerabilități
- Oportunități

7️⃣ RECOMANDĂRI (mesajul 12)
3 pași concreți, personalizați, pe care ar trebui să-i facă

8️⃣ TRANSFER (mesajul 13+)
Propune o întâlnire gratuită cu un consultant uman OVB:
"Pot să te conectez cu un consultant specialist care să-ți facă un plan complet gratuit. Ți-ar conveni?"

REGULI CRITICE:
- NU recomanda produse financiare specifice (fonduri, asigurări cu nume)
- NU promite randamente exacte
- NU da cifre inventate despre piață
- Dacă clientul pare neliniștit, validează-i emoția înainte de orice altceva
- Dacă dă răspunsuri scurte, oferă opțiuni ("De exemplu, vorbim de X sau Y?")
- Fii ONEST dacă ceva depășește expertiza unui AI
- Nu repeta informații pe care clientul ți le-a spus deja

FORMAT:
Răspunde DOAR cu textul mesajului. Fără prefixuri, fără markdown, fără asteriscuri, fără ghilimele.
Textul trebuie să sune perfect natural când e citit cu voce tare.`;

/* ─────────────────────────────────────────────────────────
   CHAT — single response
   ───────────────────────────────────────────────────────── */
async function chat(messages, context = {}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  let prompt = SYSTEM_PROMPT;
  if (context.calculatorType) {
    const ctx = {
      retirement: 'Clientul vine dintr-un calculator de pensie — focusează pe gap-ul de pensie.',
      insurance: 'Clientul vine dintr-un calculator de protecție — focusează pe asigurări de viață.',
      savings: 'Clientul vine dintr-un calculator de economii — focusează pe strategii de economisire.',
      investment: 'Clientul vine dintr-un calculator de investiții — focusează pe creșterea capitalului.',
      children: 'Clientul vine dintr-un calculator de educație — focusează pe costurile pentru copii.',
    };
    prompt += `\n\nCONTEXT: ${ctx[context.calculatorType] || ''}`;
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: prompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  return response.content[0].text;
}

/* ─────────────────────────────────────────────────────────
   STREAM — SSE streaming response
   ───────────────────────────────────────────────────────── */
async function chatStream(messages, context = {}, onChunk) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  let prompt = SYSTEM_PROMPT;
  if (context.calculatorType) {
    const ctx = {
      retirement: 'Clientul vine dintr-un calculator de pensie.',
      insurance: 'Clientul vine dintr-un calculator de protecție.',
      savings: 'Clientul vine dintr-un calculator de economii.',
      investment: 'Clientul vine dintr-un calculator de investiții.',
      children: 'Clientul vine dintr-un calculator de educație.',
    };
    prompt += `\n\nCONTEXT: ${ctx[context.calculatorType] || ''}`;
  }

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: prompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  let full = '';
  stream.on('text', (text) => {
    full += text;
    if (onChunk) onChunk(text);
  });

  await stream.finalMessage();
  return full;
}

/* ─────────────────────────────────────────────────────────
   EXTRACT — structured lead data from conversation
   ───────────────────────────────────────────────────────── */
async function extractLeadData(messages) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: `Analizează conversația și extrage datele clientului. Returnează DOAR JSON valid:
{
  "name": "string|null",
  "age": "number|null",
  "familyStatus": "string|null",
  "occupation": "string|null",
  "monthlyIncome": "number|null",
  "monthlySavings": "number|null",
  "hasInsurance": "boolean|null",
  "hasCredit": "boolean|null",
  "numberOfKids": "number|null",
  "existingSavings": "number|null",
  "goals": ["array of strings"],
  "concerns": ["array of strings"],
  "riskProfile": "conservative|moderate|aggressive|null",
  "summary": "rezumat scurt al situației clientului (română, max 100 cuvinte)",
  "readiness": "hot|warm|cold",
  "recommendedProducts": ["tipuri de produse recomandate, nu branduri"],
  "financialScore": "number 1-100, estimare a sănătății financiare"
}`,
      messages: [{
        role: 'user',
        content: `Conversația:\n\n${messages.map(m => `${m.role === 'user' ? 'Client' : 'Ana (AI)'}: ${m.content}`).join('\n')}`,
      }],
    });

    const text = response.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.error('Extract error:', err.message);
    return null;
  }
}

module.exports = { chat, chatStream, extractLeadData };
