// Vercel-compatible database using Upstash Redis (REST API, no extra packages)
// Upstash free tier: 10k commands/day, 1000 concurrent connections

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
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Command: command, Args: args }),
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
    answers_json: data.answersJson,
    final_type: data.finalType,
    type_cn: data.typeCn,
    match_score: data.matchScore,
    dims_json: data.dimsJson,
    ip: data.ip,
  });

  const pushResult = await upstashCommand(['LPUSH', 'sbti_results', record]);
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

  const start = options?.offset || 0;
  const end = start + (options?.limit || 100) - 1;

  const raw = await upstashCommand(['LRANGE', 'sbti_results', String(start), String(end)]);
  const items: string[] = (raw && Array.isArray((raw as any).result)) ? (raw as any).result : [];
  if (!items || items.length === 0) return [];

  const results: ResultRecord[] = items.map((item: string) => JSON.parse(item));
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
  if (typeof raw === 'number') return raw;
  if (raw && typeof (raw as any).result === 'number') return (raw as any).result;
  return 0;
}

export async function getAllTypes(): Promise<string[]> {
  const all = await getResults({ limit: 1000 });
  return Array.from(new Set(all.map(r => r.final_type))).sort();
}
