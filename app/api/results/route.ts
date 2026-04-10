import { NextRequest, NextResponse } from 'next/server';
import { getResults, getResultCount, getAllTypes } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const results = await getResults({ type, limit, offset });
    const total = await getResultCount();
    const types = await getAllTypes();

    return NextResponse.json({ results, total, types, debug: { upstashUrl: !!process.env.UPSTASH_REDIS_REST_URL } });
  } catch (err) {
    console.error('Results error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
