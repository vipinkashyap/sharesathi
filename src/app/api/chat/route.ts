import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Groq API key from environment variable
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are ShareSathi, a helpful AI assistant for Indian stock market investors.
You help users understand their stock portfolio, market trends, and provide educational information about investing.

Key guidelines:
- Focus on the Indian stock market (BSE/NSE)
- Use Indian Rupee (₹) for currency
- Explain concepts in simple terms suitable for retail investors, especially older adults
- Be concise and helpful - keep responses under 150 words
- Never give specific buy/sell recommendations - only educational information
- When discussing numbers, use Indian numbering system (lakhs, crores)
- If you don't know something, say so honestly
- Be warm and patient, as you're helping someone who may not be tech-savvy

Remember: This is for educational purposes only, not financial advice.`;

// Chat with Groq (Llama 3)
async function chatWithGroq(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Groq error:', response.status, error);

    // Check for quota/rate limit errors
    if (response.status === 429 || response.status === 402) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw new Error('Groq API error');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'I could not generate a response.';
}

// Fallback: Simple rule-based responses
function getSimpleResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('what is') && lowerMessage.includes('sensex')) {
    return 'SENSEX (Sensitive Index) is the benchmark index of the Bombay Stock Exchange (BSE), comprising 30 of the largest and most actively traded stocks. It reflects the overall health of the Indian economy and stock market. When SENSEX goes up, it generally means the market is doing well!';
  }

  if (lowerMessage.includes('what is') && lowerMessage.includes('nifty')) {
    return 'NIFTY 50 is the benchmark index of the National Stock Exchange (NSE), consisting of 50 large-cap companies. It represents about 65% of the free-float market capitalization of stocks listed on NSE. It\'s one of the most watched indicators of the Indian stock market.';
  }

  if (lowerMessage.includes('market cap')) {
    return 'Market Capitalization (Market Cap) is the total value of a company\'s shares. It\'s calculated as: Share Price × Total Shares. In India, companies are classified as:\n• Large Cap: ₹20,000+ Crore\n• Mid Cap: ₹5,000-20,000 Crore\n• Small Cap: Below ₹5,000 Crore\n\nLarger companies are generally considered safer but may grow slower.';
  }

  if (lowerMessage.includes('pe ratio') || lowerMessage.includes('p/e')) {
    return 'P/E (Price-to-Earnings) ratio tells you how much investors are paying for each rupee of profit. Formula: Share Price ÷ Earnings Per Share.\n\n• Low P/E (below 15): May be undervalued or slow growth\n• High P/E (above 25): Investors expect high growth\n\nThe average P/E for NIFTY 50 is around 20-22.';
  }

  if (lowerMessage.includes('dividend')) {
    return 'A dividend is a portion of company profits given to shareholders. If you own shares, you receive money without selling!\n\nDividend Yield = (Annual Dividend ÷ Share Price) × 100\n\nExample: If a ₹100 stock gives ₹5 dividend, yield is 5%.\n\nNote: In India, dividends are taxed at your income tax slab rate.';
  }

  if (lowerMessage.includes('bull') && lowerMessage.includes('bear')) {
    return 'Bull Market: When prices are rising and investors are optimistic. Like a bull thrusting its horns upward!\n\nBear Market: When prices are falling and investors are pessimistic. Like a bear swiping its paw downward.\n\nRemember: Markets go through cycles. Stay patient and don\'t panic during bear markets!';
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi') {
    return 'Namaste! I\'m ShareSathi, your friendly stock market assistant. I can help you understand:\n\n• Market indices (SENSEX, NIFTY)\n• Stock terms (P/E ratio, Market Cap)\n• Your watchlist performance\n• Basic investing concepts\n\nWhat would you like to know?';
  }

  if (lowerMessage.includes('thank')) {
    return 'You\'re most welcome! Feel free to ask anytime you have questions about stocks or the market. Happy investing!';
  }

  if (lowerMessage.includes('how') && (lowerMessage.includes('buy') || lowerMessage.includes('invest'))) {
    return 'To invest in Indian stocks, you need:\n\n1. PAN Card\n2. Demat Account (through Zerodha, Groww, etc.)\n3. Linked Bank Account\n\nStart small, invest regularly (SIP in mutual funds is great for beginners), and never invest money you can\'t afford to lose.\n\nWould you like to know more about any specific topic?';
  }

  return 'I can help you understand stock market concepts! Try asking me about:\n\n• "What is SENSEX?"\n• "Explain P/E ratio"\n• "What is market cap?"\n• "How do dividends work?"\n• "Bull vs Bear market"';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, customPrompt } = body as {
      messages: ChatMessage[];
      context?: { stocks?: { symbol: string; name: string; price: number; changePercent: number }[] };
      customPrompt?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];

    // Build system prompt with optional custom context
    let systemPrompt = customPrompt || SYSTEM_PROMPT;

    // Add context about user's watchlist if available
    if (context?.stocks && context.stocks.length > 0) {
      const stockSummary = context.stocks
        .slice(0, 10)
        .map(s => `${s.name}: ₹${s.price.toFixed(2)} (${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`)
        .join(', ');

      systemPrompt += `\n\nUser's current watchlist: ${stockSummary}`;
    }

    let response: string;
    let unavailable = false;

    try {
      response = await chatWithGroq(messages, systemPrompt);
    } catch (error) {
      console.error('Groq error, falling back to simple:', error);

      if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
        unavailable = true;
      }

      response = getSimpleResponse(lastMessage.content);
    }

    return NextResponse.json({ response, unavailable });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat', response: 'Sorry, I encountered an error. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    available: true,
    model: 'llama-3.1-8b-instant',
  });
}
