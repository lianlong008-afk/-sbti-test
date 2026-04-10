import { NextRequest, NextResponse } from 'next/server';
import { getResults, getResultCount, getAllTypes } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug?: string } }
) {
  try {
    const url = _req.nextUrl;
    const type = url.searchParams.get('type') || undefined;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined;

    const results = await getResults({ type, limit, offset });
    const total = await getResultCount();
    const types = await getAllTypes();

    return NextResponse.json({ results, total, types, debug: { upstashUrl: !!process.env.UPSTASH_REDIS_REST_URL } });
  } catch (err) {
    console.error('Results error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
