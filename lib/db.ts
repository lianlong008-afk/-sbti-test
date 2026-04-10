// Vercel-compatible database using Upstash Redis (REST API, no extra packages)
// Upstash free tier: 10k commands/day, 1000 concurrent connections
// If env vars are not set, falls back to in-memory (for local dev)

interface ResultRecord {
  id: number;
  submitted_at: string;
  answers_json: string;
  final_type: string;
  type_cn: string;
  match_score: number;
  dims_json: string;
  ip: string;
}

let inMemoryResults: ResultRecord[] = [];
let inMemoryNextId = 1;

function getUpstashUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL;
}

function getUpstashToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN;
}

async function upstashCommand(cmd: string[]): Promise<any> {
  const url = getUpstashUrl();
  const token = getUpstashToken();
  if (!url || !token) return null;

  const [command, ...args] = cmd;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: command, args }),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Upstash request failed:', e);
    return null;
  }
}

export async function insertResult(data: {
  answersJson: string;
  finalType: string;
  typeCn: string;
  matchScore: number;
  dimsJson: string;
  ip: string;
}): Promise<{ success: boolean; error?: string }> {
  const url = getUpstashUrl();
  const token = getUpstashToken();

  if (!url || !token) {
    inMemoryResults.unshift({
      id: inMemoryNextId++,
      submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      answers_json: data.answersJson,
      final_type: data.finalType,
      type_cn: data.typeCn,
      match_score: data.matchScore,
      dims_json: data.dimsJson,
      ip: data.ip,
    });
    return { success: true };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newId = Date.now();
  const record = JSON.stringify({
    id: newId,
    submitted_at: now,
    answers_json: data.answersJson,
    final_type: data.finalType,
    type_cn: data.typeCn,
    match_score: data.matchScore,
    dims_json: data.dimsJson,
    ip: data.ip,
  });

  const pushResult = await upstashCommand(['LPUSH', 'sbti_results', record]);
  if (pushResult === null || pushResult === undefined) {
    return { success: false, error: 'Upstash network error' };
  }
  // Upstash returns { result: <number> } for LPUSH
  const pushCount = typeof pushResult === 'object' && pushResult !== null
    ? (pushResult as any).result
    : (pushResult as any);
  if (typeof pushCount !== 'number') {
    return { success: false, error: `LPUSH failed: ${JSON.stringify(pushResult)}` };
  }

  return { success: true };
}

export async function getResults(options?: { type?: string; limit?: number; offset?: number }): Promise<ResultRecord[]> {
  const url = getUpstashUrl();
  const token = getUpstashToken();

  if (!url || !token) {
    let results = [...inMemoryResults];
    if (options?.type) results = results.filter(r => r.final_type === options.type);
    return results;
  }

  const start = options?.offset || 0;
  const end = (options?.limit ? options.limit : 100) - 1;

  const raw = await upstashCommand(['LRANGE', 'sbti_results', String(start), String(end)]);
  if (raw === null) return [];

  // Upstash returns { result: [...] } - extract the array from result field
  let items: any[] = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object' && Array.isArray((raw as any).result)) {
    items = (raw as any).result;
  } else if (raw && typeof raw === 'object' && 'result' in raw) {
    // result might be null or a number
    return [];
  }

  if (!items || items.length === 0) return [];

  const results: ResultRecord[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      try {
        results.push(JSON.parse(item));
      } catch {
        // skip invalid JSON
      }
    }
  }

  if (options?.type) {
    return results.filter(r => r.final_type === options.type);
  }
  return results;
}

export async function getResultCount(): Promise<number> {
  const url = getUpstashUrl();
  const token = getUpstashToken();

  if (!url || !token) return inMemoryResults.length;

  const raw = await upstashCommand(['LLEN', 'sbti_results']);
  if (raw === null) return 0;
  if (typeof raw === 'number') return raw;
  if (raw && typeof (raw as any).result === 'number') return (raw as any).result;
  return 0;
}

export async function getAllTypes(): Promise<string[]> {
  const all = await getResults({ limit: 1000 });
  const types = Array.from(new Set(all.map(r => r.final_type)));
  return types.sort();
}
