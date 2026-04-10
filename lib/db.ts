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

interface UpstashListResponse {
  cursor?: number;
  results: Array<{ value: string }>;
}

let inMemoryResults: ResultRecord[] = [];
let inMemoryNextId = 1;
let useInMemory = false;

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
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: command, args }),
  });
  return res.json();
}

export async function insertResult(data: {
  answersJson: string;
  finalType: string;
  typeCn: string;
  matchScore: number;
  dimsJson: string;
  ip: string;
}): Promise<void> {
  const url = getUpstashUrl();
  const token = getUpstashToken();

  if (!url || !token) {
    // Fallback to in-memory
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
    return;
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newId = Date.now();
  const record = JSON.stringify({
    id: newId,
    submitted_at: now,
    ...data,
  });

  await upstashCommand(['LPUSH', 'sbti_results', record]);
  await upstashCommand(['LTRIM', 'sbti_results', '0', '9999']);
}

export async function getResults(options?: { type?: string; limit?: number; offset?: number }): Promise<ResultRecord[]> {
  const url = getUpstashUrl();
  const token = getUpstashToken();

  if (!url || !token) {
    let results = [...inMemoryResults];
    if (options?.type) results = results.filter(r => r.final_type === options.type);
    return results;
  }

  const count = options?.limit ? (options.limit + (options?.offset || 0)) : 100;
  const start = options?.offset || 0;
  const end = start + (options?.limit || 100) - 1;

  const raw = await upstashCommand(['LRANGE', 'sbti_results', String(start), String(end)]);
  const items = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.result)) ? raw.result : [];
  if (!items || items.length === 0) return [];

  let results: ResultRecord[] = items.map((item: string) => JSON.parse(item));

  if (options?.type) {
    results = results.filter(r => r.final_type === options.type);
  }

  return results;
}

export async function getResultCount(): Promise<number> {
  const url = getUpstashUrl();
  const token = getUpstashToken();

  if (!url || !token) return inMemoryResults.length;

  const raw = await upstashCommand(['LLEN', 'sbti_results']);
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw.result === 'number') return raw.result;
  return 0;
}

export async function getAllTypes(): Promise<string[]> {
  const all = await getResults({ limit: 1000 });
  const types = Array.from(new Set(all.map(r => r.final_type)));
  return types.sort();
}
