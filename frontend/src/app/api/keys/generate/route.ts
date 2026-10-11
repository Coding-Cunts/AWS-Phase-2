import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey } from '@/lib/api-keys';

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
