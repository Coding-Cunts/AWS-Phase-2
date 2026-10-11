import { NextRequest, NextResponse } from 'next/server';
import { revokeApiKey, deleteApiKey } from '@/lib/api-keys';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyId, key, action = 'revoke' } = body;

    const target = keyId || key;
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Missing keyId or key' },
        { status: 400 }
      );
    }

    if (action === 'delete') {
      const deleted = await deleteApiKey(target);
      return NextResponse.json({ success: deleted, action: 'deleted' });
    }

    const revoked = await revokeApiKey(target);
    return NextResponse.json({ success: revoked, action: 'revoked' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update key status' },
      { status: 500 }
    );
  }
}
