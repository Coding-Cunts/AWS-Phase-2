import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, generateApiKey } from '@/lib/api-keys';

export async function GET() {
  try {
    const keys = await getApiKeys();
    return NextResponse.json({ success: true, keys });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const label = body.label || body.name;
    const newKey = await generateApiKey(label);
    return NextResponse.json(
      { success: true, key: newKey.key, apiKey: newKey },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate API key' },
      { status: 500 }
    );
  }
}
