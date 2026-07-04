import { NextResponse } from 'next/server';

// GET handler for Meta Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

// POST handler for receiving WhatsApp messages
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Log for debugging
    console.log('[Next.js Gateway] Received WhatsApp Webhook Payload:', JSON.stringify(payload, null, 2));

    // Forward the payload to the Python AI Microservice asynchronously
    // We don't await the Python server's response to ensure we return 200 OK to Meta instantly
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
    
    fetch(`${pythonBackendUrl}/internal/process-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(err => {
      console.error('[Next.js Gateway] Failed to forward payload to Python:', err);
    });

    // Instantly acknowledge receipt to Meta to prevent timeouts
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Next.js Gateway] Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
