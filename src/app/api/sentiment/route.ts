import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiToken = process.env.HUGGINGFACE_API_TOKEN;
    const apiUrl = process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models';

    console.log('🤖 API Route: Analyzing sentiment for:', text);
    console.log('🔑 Token available:', !!apiToken);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    const response = await fetch(`${apiUrl}/cardiffnlp/twitter-roberta-base-sentiment-latest`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: text,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ Sentiment API returned ${response.status}: ${response.statusText}`);
      
      // Return a fallback response instead of throwing
      return NextResponse.json({ 
        sentiment: 'NEUTRAL',
        confidence: 0.5,
        fallback: true 
      });
    }

    const result = await response.json();
    console.log('📊 Sentiment API response:', result);

    if (result && result[0] && result[0].label) {
      return NextResponse.json({ 
        sentiment: result[0].label.toUpperCase(),
        confidence: result[0].score || 0.5,
        fallback: false
      });
    } else {
      return NextResponse.json({ 
        sentiment: 'NEUTRAL',
        confidence: 0.5,
        fallback: true 
      });
    }
  } catch (error) {
    console.error('❌ Sentiment API error:', error);
    
    // Return fallback instead of error
    return NextResponse.json({ 
      sentiment: 'NEUTRAL',
      confidence: 0.5,
      fallback: true 
    });
  }
}
