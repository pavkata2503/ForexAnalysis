const express = require('express');
const OpenAI = require('openai'); 
const bodyParser = require('body-parser');
const Parser = require('rss-parser'); 

const app = express();
app.use(bodyParser.json());

// --- ВАЖНО: Сложи твоя Groq ключ тук ---
// --- КОНФИГУРАЦИЯ ---
// Вече не пишеш ключа директно тук!
// process.env означава "вземи го от настройките на сървъра"
const GROQ_API_KEY = process.env.GROQ_API_KEY; 

const openai = new OpenAI({ 
    apiKey: GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1" 
});

const RSS_FEED_URL = "https://www.fxstreet.com/rss/news";

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml; q=0.1',
    }
});

// FRONTEND (Модерен Дизайн)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="bg">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Market Terminal</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-color: #0f172a;
                --card-bg: rgba(30, 41, 59, 0.7);
                --primary: #3b82f6;
                --accent: #60a5fa;
                --bullish: #10b981; /* Green */
                --bearish: #ef4444; /* Red */
                --neutral: #f59e0b; /* Orange */
                --text-main: #f8fafc;
                --text-sub: #94a3b8;
            }

            body {
                font-family: 'Inter', sans-serif;
                background-color: var(--bg-color);
                background-image: radial-gradient(circle at top right, #1e293b, #0f172a);
                color: var(--text-main);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }

            .dashboard {
                background: var(--card-bg);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                width: 90%;
                max-width: 600px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                transition: transform 0.3s ease;
            }

            h1 {
                font-weight: 800;
                font-size: 2rem;
                text-align: center;
                margin-bottom: 30px;
                background: linear-gradient(to right, #3b82f6, #8b5cf6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -1px;
            }

            /* Controls Section */
            .controls {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
            }

            select {
                flex: 1;
                background: rgba(15, 23, 42, 0.8);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 15px;
                border-radius: 12px;
                font-size: 1rem;
                outline: none;
                cursor: pointer;
                transition: border 0.2s;
            }

            select:focus {
                border-color: var(--primary);
            }

            button {
                flex: 1;
                background: linear-gradient(135deg, var(--primary), #2563eb);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
                transition: all 0.2s;
            }

            button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
            }

            button:active {
                transform: translateY(0);
            }

            /* Loader */
            .loader {
                display: none;
                text-align: center;
                margin: 20px 0;
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255,255,255,0.1);
                border-top-color: var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            @keyframes spin { 100% { transform: rotate(360deg); } }

            /* Results Section */
            #result-card {
                display: none;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 16px;
                padding: 25px;
                border: 1px solid rgba(255,255,255,0.05);
                animation: fadeUp 0.5s ease-out;
            }

            @keyframes fadeUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 50px;
                font-size: 0.9rem;
                font-weight: 800;
                text-transform: uppercase;
                margin-bottom: 15px;
                letter-spacing: 1px;
            }

            /* Decision Colors */
            .glow-bullish {
                background: rgba(16, 185, 129, 0.2);
                color: var(--bullish);
                border: 1px solid var(--bullish);
                box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
            }
            .glow-bearish {
                background: rgba(239, 68, 68, 0.2);
                color: var(--bearish);
                border: 1px solid var(--bearish);
                box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
            }
            .glow-neutral {
                background: rgba(245, 158, 11, 0.2);
                color: var(--neutral);
                border: 1px solid var(--neutral);
            }

            #summary {
                line-height: 1.7;
                font-size: 1.05rem;
                color: var(--text-main);
                margin-bottom: 25px;
            }

            .news-section {
                border-top: 1px solid rgba(255,255,255,0.1);
                padding-top: 20px;
            }

            .news-section small {
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-sub);
                font-size: 0.75rem;
                font-weight: 600;
            }

            ul {
                list-style: none;
                padding: 0;
                margin-top: 10px;
            }

            li {
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 0.9rem;
                color: var(--text-sub);
            }
            li:last-child { border-bottom: none; }
            li:before { content: "• "; color: var(--primary); }

            #error-box {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid var(--bearish);
                color: #fca5a5;
                padding: 15px;
                border-radius: 10px;
                display: none;
                margin-top: 20px;
                text-align: center;
            }

        </style>
    </head>
    <body>

        <div class="dashboard">
            <h1>Pavkata AI Market Intelligence</h1>
            
            <div class="controls">
                <select id="pair">
                    <option value="EURUSD">EUR / USD</option>
                    <option value="GBPUSD">GBP / USD</option>
                    <option value="USDJPY">USD / JPY</option>
                    <option value="XAUUSD">GOLD (XAU)</option>
                    <option value="BTCUSD">BITCOIN</option>
                </select>
                <button onclick="analyze()">ANALYZE</button>
            </div>

            <div class="loader" id="loader">
                <div class="spinner"></div>
                <p style="color: var(--text-sub); font-size: 0.9rem;">Processing institutional data...</p>
            </div>

            <div id="error-box"></div>

            <div id="result-card">
                <div style="text-align: center;">
                    <span id="decision-badge" class="badge">NEUTRAL</span>
                </div>
                <p id="summary"></p>
                
                <div class="news-section">
                    <small>Data Sources (FXStreet)</small>
                    <ul id="news-list"></ul>
                </div>
            </div>
        </div>

        <script>
            async function analyze() {
                const pair = document.getElementById('pair').value;
                const loader = document.getElementById('loader');
                const resultCard = document.getElementById('result-card');
                const errorBox = document.getElementById('error-box');
                const badge = document.getElementById('decision-badge');
                
                // Reset UI
                loader.style.display = 'block';
                resultCard.style.display = 'none';
                errorBox.style.display = 'none';
                badge.className = 'badge'; // reset classes

                try {
                    const response = await fetch('/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pair })
                    });
                    const data = await response.json();

                    if(data.error) {
                        errorBox.innerText = "Error: " + data.details;
                        errorBox.style.display = 'block';
                        loader.style.display = 'none';
                        return;
                    }

                    // Update Badge Styling
                    let decisionText = data.decision.replace('РЕШЕНИЕ:', '').trim().toUpperCase();
                    badge.innerText = decisionText;
                    
                    if(decisionText.includes('BULLISH') || decisionText.includes('КУПУВАНЕ')) {
                        badge.classList.add('glow-bullish');
                    } else if(decisionText.includes('BEARISH') || decisionText.includes('ПРОДАВАНЕ')) {
                        badge.classList.add('glow-bearish');
                    } else {
                        badge.classList.add('glow-neutral');
                    }

                    document.getElementById('summary').innerText = data.summary;
                    
                    const list = document.getElementById('news-list');
                    list.innerHTML = '';
                    data.articles.forEach(t => {
                        const li = document.createElement('li');
                        li.innerText = t;
                        list.appendChild(li);
                    });
                    
                    resultCard.style.display = 'block';

                } catch (error) {
                    errorBox.innerText = "Connection failed. Please check backend.";
                    errorBox.style.display = 'block';
                } finally {
                    loader.style.display = 'none';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// BACKEND (Същата логика, Llama 3.3)
app.post('/analyze', async (req, res) => {
    try {
        if (!GROQ_API_KEY || GROQ_API_KEY.includes("...")) {
            throw new Error("Моля въведи валиден Groq API ключ в кода!");
        }

        const pair = req.body.pair;
        console.log(`Analyzing ${pair}...`);

        let keywords = [];
        if (pair === 'EURUSD') keywords = ['EUR', 'USD', 'Euro', 'Dollar', 'ECB', 'Fed'];
        if (pair === 'GBPUSD') keywords = ['GBP', 'USD', 'Pound', 'UK', 'BoE'];
        if (pair === 'USDJPY') keywords = ['JPY', 'USD', 'Yen', 'BoJ', 'Japan'];
        if (pair === 'XAUUSD') keywords = ['Gold', 'XAU', 'USD', 'Metals'];
        if (pair === 'BTCUSD') keywords = ['Bitcoin', 'BTC', 'Crypto', 'SEC'];

        let feed = await parser.parseURL(RSS_FEED_URL);
        
        let relevantNews = feed.items.filter(item => {
            return keywords.some(k => item.title.includes(k) || item.contentSnippet.includes(k));
        });

        if (relevantNews.length === 0) relevantNews = feed.items.slice(0, 5);
        else relevantNews = relevantNews.slice(0, 8);

        const newsText = relevantNews.map(n => `- ${n.title}`).join("\n");

        const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile", 
            messages: [
                { role: "system", content: "Ти си експерт трейдър. Върни само чист JSON: { \"decision\": \"[BULLISH/BEARISH/NEUTRAL]\", \"summary\": \"Текст на Български...\" }." },
                { role: "user", content: `Анализирай тези новини за ${pair}:\n${newsText}` }
            ],
            temperature: 0.5,
        });

        const aiResponse = completion.choices[0].message.content;
        
        let parsedResult;
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsedResult = JSON.parse(jsonMatch[0]);
            else parsedResult = { decision: "NEUTRAL", summary: aiResponse };
        } catch (e) {
             parsedResult = { decision: "NEUTRAL", summary: aiResponse };
        }

        res.json({
            decision: parsedResult.decision,
            summary: parsedResult.summary,
            articles: relevantNews.map(n => n.title)
        });

    } catch (error) {
        console.error("Грешка:", error.message);
        res.json({ error: true, details: error.message });
    }
});

app.listen(3000, () => {
    console.log('Сървърът е готов! (http://localhost:3000)');
});