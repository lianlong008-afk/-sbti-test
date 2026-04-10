import { NextRequest, NextResponse } from 'next/server';
import { insertResult } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, finalType, typeCn, matchScore, dims } = body;

    if (!answers || !finalType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    await insertResult({
      answersJson: JSON.stringify(answers),
      finalType,
      typeCn: typeCn || '',
      matchScore: matchScore || 0,
      dimsJson: JSON.stringify(dims || {}),
      ip,
    });

    return NextResponse.json({
      success: true,
      debug: { upstashUrl: !!process.env.UPSTASH_REDIS_REST_URL }
    });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
