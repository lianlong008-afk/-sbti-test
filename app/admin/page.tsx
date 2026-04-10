'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sbti-admin';

interface Result {
  id: number;
  submitted_at: string;
  answers_json: string;
  final_type: string;
  type_cn: string;
  match_score: number;
  dims_json: string;
  ip: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setAuthError(false);
      localStorage.setItem('sbti_admin_auth', '1');
    } else {
      setAuthError(true);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
      setAllTypes(data.types || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const auth = localStorage.getItem('sbti_admin_auth');
    if (auth === '1') setLoggedIn(true);
  }, []);

  useEffect(() => {
    if (loggedIn) fetchResults();
  }, [loggedIn, filterType]);

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '22px', border: '1px solid var(--line)', boxShadow: 'var(--shadow)', width: '360px' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '20px', color: 'var(--accent-strong)' }}>管理后台登录</h2>
          <input
            type="password"
            placeholder="输入管理员密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '15px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }}
          />
          {authError && <p style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '12px' }}>密码错误</p>}
          <button onClick={handleLogin} className="btn-primary" style={{ width: '100%' }}>登录</button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/" style={{ color: 'var(--accent-strong)', fontSize: '13px' }}>返回测试首页</Link>
          </div>
        </div>
      </div>
    );
  }

  const filtered = search
    ? results.filter(r => {
        const ans = JSON.parse(r.answers_json || '{}');
        return Object.values(ans).some(v => String(v).includes(search));
      })
    : results;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', color: 'var(--accent-strong)', marginBottom: '4px' }}>SBTI 管理后台</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>共 {total} 条测试记录</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="搜索答案..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '14px', background: 'white' }}
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '14px', background: 'white' }}
            >
              <option value="">全部人格</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={fetchResults} className="btn-secondary" style={{ padding: '10px 16px', fontSize: '14px' }}>刷新</button>
            <Link href="/" className="btn-secondary" style={{ padding: '10px 16px', fontSize: '14px', textDecoration: 'none' }}>返回首页</Link>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>加载中...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>暂无记录</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(r => {
              const answers = JSON.parse(r.answers_json || '{}');
              const dims = JSON.parse(r.dims_json || '{}');
              const isOpen = expandedId === r.id;
              return (
                <div key={r.id} style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--line)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpandedId(isOpen ? null : r.id)}
                    style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent-strong)' }}>{r.final_type}</span>
                      <span style={{ color: 'var(--text)', fontSize: '14px' }}>{r.type_cn}</span>
                      <span style={{ background: 'var(--soft)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, color: 'var(--accent-strong)' }}>{r.match_score}%</span>
                      <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{r.submitted_at}</span>
                      {r.ip && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>IP: {r.ip}</span>}
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{isOpen ? '收起' : '展开'}</span>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--line)', padding: '16px 20px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>十五维度得分</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                          {Object.entries(dims).map(([dim, data]: [string, any]) => (
                            <div key={dim} style={{ background: 'var(--soft)', padding: '8px 12px', borderRadius: '10px', fontSize: '13px' }}>
                              <span style={{ fontWeight: 700 }}>{dim}</span>: {data.level} ({data.score}分)
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>所有答案</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '6px' }}>
                          {Object.entries(answers).map(([qId, val]: [string, any]) => (
                            <div key={qId} style={{ fontSize: '12px', color: 'var(--text)' }}>
                              <span style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>{qId}</span>: <span style={{ fontWeight: 700 }}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
