import { questions, specialQuestions, TYPE_LIBRARY, NORMAL_TYPES, dimensionMeta, dimensionOrder, DIM_EXPLANATIONS } from './data';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sumToLevel(score: number): string {
  if (score <= 3) return 'L';
  if (score === 4) return 'M';
  return 'H';
}

function levelNum(level: string): number {
  return { L: 1, M: 2, H: 3 }[level] || 2;
}

function parsePattern(pattern: string): string[] {
  return pattern.replace(/-/g, '').split('');
}

export interface ComputedResult {
  answers: Record<string, number>;
  finalType: {
    code: string;
    cn: string;
    intro: string;
    desc: string;
  };
  modeKicker: string;
  badge: string;
  sub: string;
  special: boolean;
  dims: Record<string, { level: string; score: number; explanation: string; name: string }>;
  ranked: Array<{
    code: string;
    similarity: number;
    exact: number;
    distance: number;
  }>;
  shuffledQuestions: string[];
}

export function computeResult(answers: Record<string, number>): ComputedResult {
  const rawScores: Record<string, number> = {};
  Object.keys(dimensionMeta).forEach(dim => { rawScores[dim] = 0; });

  questions.forEach(q => {
    if (answers[q.id] !== undefined) {
      rawScores[q.dim] += answers[q.id];
    }
  });

  const levels: Record<string, string> = {};
  Object.entries(rawScores).forEach(([dim, score]) => {
    levels[dim] = sumToLevel(score);
  });

  const userVector = dimensionOrder.map(dim => levelNum(levels[dim]));

  const ranked = NORMAL_TYPES.map(type => {
    const vector = parsePattern(type.pattern).map(levelNum);
    let distance = 0;
    let exact = 0;
    for (let i = 0; i < vector.length; i++) {
      const diff = Math.abs(userVector[i] - vector[i]);
      distance += diff;
      if (diff === 0) exact += 1;
    }
    const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
    return { code: type.code, similarity, exact, distance };
  }).sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return b.similarity - a.similarity;
  });

  const bestNormal = ranked[0];
  const drinkTriggered = answers['drink_gate_q1'] === 3 && answers['drink_gate_q2'] === 2;

  let finalType: ComputedResult['finalType'];
  let modeKicker = '你的主类型';
  let badge = `匹配度 ${bestNormal.similarity}% · 精准命中 ${bestNormal.exact}/15 维`;
  let sub = '维度命中度较高，当前结果可视为你的第一人格画像。';
  let special = false;

  if (drinkTriggered) {
    const drunk = TYPE_LIBRARY['DRUNK'];
    finalType = { code: drunk.code, cn: drunk.cn, intro: drunk.intro, desc: drunk.desc };
    modeKicker = '隐藏人格已激活';
    badge = '匹配度 100% · 酒精异常因子已接管';
    sub = '乙醇亲和性过强，系统已直接跳过常规人格审判。';
    special = true;
  } else if (bestNormal.similarity < 60) {
    const hhhh = TYPE_LIBRARY['HHHH'];
    finalType = { code: hhhh.code, cn: hhhh.cn, intro: hhhh.intro, desc: hhhh.desc };
    modeKicker = '系统强制兜底';
    badge = `标准人格库最高匹配仅 ${bestNormal.similarity}%`;
    sub = '标准人格库对你的脑回路集体罢工了，于是系统把你强制分配给了 HHHH。';
    special = true;
  } else {
    const type = TYPE_LIBRARY[bestNormal.code];
    finalType = { code: type.code, cn: type.cn, intro: type.intro, desc: type.desc };
  }

  const dims: ComputedResult['dims'] = {};
  dimensionOrder.forEach(dim => {
    dims[dim] = {
      level: levels[dim],
      score: rawScores[dim],
      explanation: DIM_EXPLANATIONS[dim][levels[dim]],
      name: dimensionMeta[dim].name,
    };
  });

  // Build shuffled question IDs for display reference
  const shuffledRegular = shuffle(questions.map(q => q.id));
  const insertIndex = Math.floor(Math.random() * shuffledRegular.length) + 1;
  const shuffledQuestions = [
    ...shuffledRegular.slice(0, insertIndex),
    'drink_gate_q1',
    ...shuffledRegular.slice(insertIndex),
  ];
  if (answers['drink_gate_q1'] === 3) {
    shuffledQuestions.splice(shuffledQuestions.indexOf('drink_gate_q1') + 1, 0, 'drink_gate_q2');
  }

  return {
    answers,
    finalType,
    modeKicker,
    badge,
    sub,
    special,
    dims,
    ranked,
    shuffledQuestions,
  };
}

export { shuffle };
