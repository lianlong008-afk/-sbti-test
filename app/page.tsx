'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { questions, specialQuestions, TYPE_LIBRARY, dimensionMeta, dimensionOrder } from '@/lib/data';

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

const NORMAL_TYPES_PATTERNS = [
  { code: "CTRL", pattern: "HHH-HMH-MHH-HHH-MHM" },
  { code: "ATM-er", pattern: "HHH-HHM-HHH-HMH-MHL" },
  { code: "Dior-s", pattern: "MHM-MMH-MHM-HMH-LHL" },
  { code: "BOSS", pattern: "HHH-HMH-MMH-HHH-LHL" },
  { code: "THAN-K", pattern: "MHM-HMM-HHM-MMH-MHL" },
  { code: "OH-NO", pattern: "HHL-LMH-LHH-HHM-LHL" },
  { code: "GOGO", pattern: "HHM-HMH-MMH-HHH-MHM" },
  { code: "SEXY", pattern: "HMH-HHL-HMM-HMM-HLH" },
  { code: "LOVE-R", pattern: "MLH-LHL-HLH-MLM-MLH" },
  { code: "MUM", pattern: "MMH-MHL-HMM-LMM-HLL" },
  { code: "FAKE", pattern: "HLM-MML-MLM-MLM-HLH" },
  { code: "OJBK", pattern: "MMH-MMM-HML-LMM-MML" },
  { code: "MALO", pattern: "MLH-MHM-MLH-MLH-LMH" },
  { code: "JOKE-R", pattern: "LLH-LHL-LML-LLL-MLM" },
  { code: "WOC!", pattern: "HHL-HMH-MMH-HHM-LHH" },
  { code: "THIN-K", pattern: "HHL-HMH-MLH-MHM-LHH" },
  { code: "SHIT", pattern: "HHL-HLH-LMM-HHM-LHH" },
  { code: "ZZZZ", pattern: "MHL-MLH-LML-MML-LHM" },
  { code: "POOR", pattern: "HHL-MLH-LMH-HHH-LHL" },
  { code: "MONK", pattern: "HHL-LLH-LLM-MML-LHM" },
  { code: "IMSB", pattern: "LLM-LMM-LLL-LLL-MLM" },
  { code: "SOLO", pattern: "LML-LLH-LHL-LML-LHM" },
  { code: "FUCK", pattern: "MLL-LHL-LLM-MLL-HLH" },
  { code: "DEAD", pattern: "LLL-LLM-LML-LLL-LHM" },
  { code: "IMFW", pattern: "LLH-LHL-LML-LLL-MLL" },
];

const DIM_EXPLANATIONS: Record<string, Record<string, string>> = {
  S1: { L: "对自己下手比别人还狠，夸你两句你都想先验明真伪。", M: "自信值随天气波动，顺风能飞，逆风先缩。", H: "心里对自己大致有数，不太会被路人一句话打散。" },
  S2: { L: "内心频道雪花较多，常在「我是谁」里循环缓存。", M: "平时还能认出自己，偶尔也会被情绪临时换号。", H: "对自己的脾气、欲望和底线都算门儿清。" },
  S3: { L: "更在意舒服和安全，没必要天天给人生开冲刺模式。", M: "想上进，也想躺会儿，价值排序经常内部开会。", H: "很容易被目标、成长或某种重要信念推着往前。" },
  E1: { L: "感情里警报器灵敏，已读不回都能脑补到大结局。", M: "一半信任，一半试探，感情里常在心里拉锯。", H: "更愿意相信关系本身，不会被一点风吹草动吓散。" },
  E2: { L: "感情投入偏克制，心门不是没开，是门禁太严。", M: "会投入，但会给自己留后手，不至于全盘梭哈。", H: "一旦认定就容易认真，情绪和精力都给得很足。" },
  E3: { L: "容易黏人也容易被黏，关系里的温度感很重要。", M: "亲密和独立都要一点，属于可调节型依赖。", H: "空间感很重要，再爱也得留一块属于自己的地。" },
  A1: { L: "看世界自带防御滤镜，先怀疑，再靠近。", M: "既不天真也不彻底阴谋论，观望是你的本能。", H: "更愿意相信人性和善意，遇事不急着把世界判死刑。" },
  A2: { L: "规则能绕就绕，舒服和自由往往排在前面。", M: "该守的时候守，该变通的时候也不死磕。", H: "秩序感较强，能按流程来就不爱即兴炸场。" },
  A3: { L: "意义感偏低，容易觉得很多事都像在走过场。", M: "偶尔有目标，偶尔也想摆烂，人生观处于半开机。", H: "做事更有方向，知道自己大概要往哪边走。" },
  Ac1: { L: "做事先考虑别翻车，避险系统比野心更先启动。", M: "有时想赢，有时只想别麻烦，动机比较混合。", H: "更容易被成果、成长和推进感点燃。" },
  Ac2: { L: "做决定前容易多转几圈，脑内会议常常超时。", M: "会想，但不至于想死机，属于正常犹豫。", H: "拍板速度快，决定一下就不爱回头磨叽。" },
  Ac3: { L: "执行力和死线有深厚感情，越晚越像要觉醒。", M: "能做，但状态看时机，偶尔稳偶尔摆。", H: "推进欲比较强，事情不落地心里都像卡了根刺。" },
  So1: { L: "社交启动慢热，主动出击这事通常得攒半天气。", M: "有人来就接，没人来也不硬凑，社交弹性一般。", H: "更愿意主动打开场子，在人群里不太怕露头。" },
  So2: { L: "关系里更想亲近和融合，熟了就容易把人划进内圈。", M: "既想亲近又想留缝，边界感看对象调节。", H: "边界感偏强，靠太近会先本能性后退半步。" },
  So3: { L: "表达更直接，心里有啥基本不爱绕。", M: "会看气氛说话，真实和体面通常各留一点。", H: "对不同场景的自我切换更熟练，真实感会分层发放。" },
};

type Screen = 'intro' | 'test' | 'result';

interface DimResult {
  level: string;
  score: number;
  explanation: string;
  name: string;
}

interface ResultData {
  finalType: { code: string; cn: string; intro: string; desc: string };
  modeKicker: string;
  badge: string;
  sub: string;
  special: boolean;
  dims: Record<string, DimResult>;
}

const OPTION_CODES = ['A', 'B', 'C', 'D'];

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [shuffledQuestions, setShuffledQuestions] = useState<typeof questions>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ResultData | null>(null);

  const startTest = useCallback(() => {
    const shuffled = shuffle(questions);
    const insertIndex = Math.floor(Math.random() * shuffled.length) + 1;
    const newList = [
      ...shuffled.slice(0, insertIndex),
      specialQuestions[0],
      ...shuffled.slice(insertIndex),
    ];
    setShuffledQuestions(newList as typeof questions);
    setAnswers({});
    setResult(null);
    setScreen('test');
  }, []);

  const getVisibleQuestions = useCallback(() => {
    const visible = [...shuffledQuestions];
    const gateIndex = visible.findIndex(q => 'id' in q && q.id === 'drink_gate_q1');
    if (gateIndex !== -1 && answers['drink_gate_q1'] === 3) {
      visible.splice(gateIndex + 1, 0, specialQuestions[1] as any);
    }
    return visible;
  }, [shuffledQuestions, answers]);

  const handleAnswer = useCallback((id: string, value: number) => {
    setAnswers(prev => {
      const next = { ...prev, [id]: value };
      if (id === 'drink_gate_q1' && value !== 3) {
        const { drink_gate_q2, ...rest } = next;
        return rest;
      }
      return next;
    });
  }, []);

  const visibleQuestions = getVisibleQuestions();
  const total = visibleQuestions.length;
  const done = visibleQuestions.filter(q => 'id' in q && answers[q.id as keyof typeof answers] !== undefined).length;
  const percent = total ? (done / total) * 100 : 0;
  const complete = done === total && total > 0;

  const handleSubmit = useCallback(async () => {
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

    const ranked = NORMAL_TYPES_PATTERNS.map(type => {
      const vector = type.pattern.replace(/-/g, '').split('').map(levelNum);
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

    let finalType: ResultData['finalType'];
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

    const dims: Record<string, DimResult> = {};
    dimensionOrder.forEach(dim => {
      dims[dim] = {
        level: levels[dim],
        score: rawScores[dim],
        explanation: DIM_EXPLANATIONS[dim][levels[dim]],
        name: dimensionMeta[dim].name,
      };
    });

    const resultData: ResultData = { finalType, modeKicker, badge, sub, special, dims };
    setResult(resultData);
    setScreen('result');

    // Submit to backend
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          finalType: finalType.code,
          typeCn: finalType.cn,
          matchScore: bestNormal.similarity,
          dims: Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, { level: v.level, score: v.score }])),
        }),
      });
    } catch (e) {
      // Silently fail if backend unavailable
    }
  }, [answers]);

  return (
    <div className="shell">
      {/* Intro Screen */}
      <section id="intro" className={`screen ${screen === 'intro' ? 'active' : ''}`}>
        <div className="hero card hero-minimal">
          <h1>MBTI已经过时，SBTI来了。</h1>
          <div className="hero-actions hero-actions-single">
            <button className="btn-primary" onClick={startTest}>开始测试</button>
          </div>
          <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--muted)', fontSize: '14px' }}>
            <span>原作者：<a href="https://space.bilibili.com/417038183" style={{ color: 'var(--accent-strong)' }}>B站@蛆肉儿串儿</a></span>
            <span>托管：Cloudflare (免费)</span>
            <span>域名：Spaceship (自费)</span>
          </div>
        </div>
      </section>

      {/* Test Screen */}
      <section id="test" className={`screen ${screen === 'test' ? 'active' : ''}`}>
        <div className="test-wrap card">
          <div className="topbar">
            <div className="progress"><span style={{ width: `${percent}%` }}></span></div>
            <div className="progress-text">{done} / {total}</div>
          </div>

          <div className="question-list">
            {visibleQuestions.map((q, qi) => {
              if (!('id' in q)) return null;
              const qId = q.id;
              const isSpecial = 'special' in q && q.special;
              return (
                <article key={qId} className="question">
                  <div className="question-meta">
                    <div className="badge">第 {qi + 1} 题</div>
                    <div>{isSpecial ? '补充题' : '维度已隐藏'}</div>
                  </div>
                  <div className="question-title">{q.text}</div>
                  <div className="options">
                    {q.options.map((opt, oi) => {
                      const code = OPTION_CODES[oi] || String(oi + 1);
                      const checked = answers[qId] === opt.value;
                      return (
                        <label key={oi} className={`option ${checked ? 'selected' : ''}`} onClick={() => handleAnswer(qId, opt.value)}>
                          <input type="radio" name={qId} value={opt.value} checked={checked} onChange={() => handleAnswer(qId, opt.value)} />
                          <div className="option-code">{code}</div>
                          <div>{opt.label}</div>
                        </label>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="actions-bottom">
            <div className="hint">
              {complete ? '都做完了。现在可以把你的电子魂魄交给结果页审判。' : '全选完才会放行。世界已经够乱了，起码把题做完整。'}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => setScreen('intro')}>返回首页</button>
              <button className="btn-primary" disabled={!complete} onClick={handleSubmit}>提交并查看结果</button>
            </div>
          </div>
        </div>
      </section>

      {/* Result Screen */}
      <section id="result" className={`screen ${screen === 'result' ? 'active' : ''}`}>
        {result && (
          <div className="result-wrap card">
            <div className="result-grid">
              <div className="result-top">
                <div className="poster-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', background: 'rgba(255,255,255,0.5)', borderRadius: '18px', color: 'var(--accent-strong)', fontSize: '80px', fontWeight: 900 }}>
                    {result.finalType.code}
                  </div>
                  <div className="poster-caption">{result.finalType.intro}</div>
                </div>
                <div className="type-box">
                  <div className="type-kicker">{result.modeKicker}</div>
                  <div className="type-name">{result.finalType.code}（{result.finalType.cn}）</div>
                  <div className="match">{result.badge}</div>
                  <div className="type-subname">{result.sub}</div>
                </div>
              </div>

              <div className="analysis-box">
                <h3>该人格的简单解读</h3>
                <p>{result.finalType.desc}</p>
              </div>

              <div className="dim-box">
                <h3>十五维度评分</h3>
                <div className="dim-list">
                  {dimensionOrder.map(dim => {
                    const d = result.dims[dim];
                    return (
                      <div key={dim} className="dim-item">
                        <div className="dim-item-top">
                          <div className="dim-item-name">{d.name}</div>
                          <div className="dim-item-score">{d.level} / {d.score}分</div>
                        </div>
                        <p>{d.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="note-box">
                <h3>友情提示</h3>
                <p>{result.special
                  ? '本测试仅供娱乐。隐藏人格和傻乐兜底都属于作者故意埋的损招，请勿把它当成医学、心理学、相学、命理学或灵异学依据。'
                  : '本测试仅供娱乐，别拿它当诊断、面试、相亲、分手、招魂、算命或人生判决书。你可以笑，但别太当真。'}
                </p>
              </div>

              <details className="author-box">
                <summary>作者的话</summary>
                <div className="author-content">
                  <p>本测试首发于b站up主蛆肉儿串儿（UID417038183），初衷是劝诫一位爱喝酒的朋友戒酒。</p>
                  <p>由于作者的人格是SHIT愤世者，所以平等的攻击了各位，在此抱歉！！不过我是一个绝世大美女，你们一定会原谅我，有B站的朋友们也可以关注我。</p>
                  <p>关于这个测试，我没法很好的平衡娱乐和专业性，因此对于一些人格的阐释较为模糊或完全不准（如屌丝可能并非真的屌丝），如有冒犯非常抱歉！！</p>
                  <p>再鉴于时间精力有限，就随便搞了一个先这样玩玩，后续会慢慢完善修改的，总之好玩为主，还请不要用于盈利呀。</p>
                </div>
              </details>

              <div className="result-actions">
                <Link href="/admin" style={{ color: 'var(--muted)', fontSize: '13px', textDecoration: 'underline' }}>
                  管理后台
                </Link>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={startTest}>重新测试</button>
                  <button className="btn-primary" onClick={() => setScreen('intro')}>回到首页</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
