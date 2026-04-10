# SBTI 人格测试 - Vercel 部署指南

## 一分钟快速部署

### 第1步：上传到 GitHub

1. 打开 https://github.com 并登录
2. 点击右上角 **+** → **New repository**
3. 名称填 `sbti-test`，选 **Public** → 点击 **Create repository**
4. 回到本项目终端执行：

```bash
cd C:\Users\ML\lobsterai\project\sbti-test
git remote add origin https://github.com/你的用户名/sbti-test.git
git push -u origin main
```

### 第2步：注册 Upstash Redis（免费数据层）

1. 打开 https://upstash.com → **Sign in with GitHub**
2. 点击 **Create Database**，区域选 **Singapore**（延迟最低）
3. 创建完成后复制两个值：
   - `REST URL`（类似 `https://xxx-ap-southeast-1.upstash.io`）
   - `REST Token`（一串 Base64 字符）

### 第3步：部署到 Vercel

1. 打开 https://vercel.com → **Sign in with GitHub**
2. 点击 **Add New Project** → 找到刚上传的 `sbti-test` 仓库 → 点击 **Import**
3. 在 **Environment Variables** 中添加 3 个变量：

| Variable Name | Value |
|--------------|-------|
| `UPSTASH_REDIS_REST_URL` | 粘贴 Upstash 的 REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | 粘贴 Upstash 的 REST Token |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | `sbti-admin`（或你想要的密码）|

4. 点击 **Deploy**

### 第4步：等待上线

约 1-2 分钟后，Vercel 会自动分配一个免费域名：
`https://sbti-test.vercel.app`

后台地址：`https://sbti-test.vercel.app/admin`

---

## 项目结构

```
sbti-test/
├── app/
│   ├── admin/page.tsx      # 后台管理
│   ├── api/submit/        # 提交结果
│   ├── api/results/      # 获取结果列表
│   └── page.tsx          # 测试页面
├── lib/
│   ├── data.ts           # 30道题 + 27种人格数据
│   ├── calc.ts           # 人格计算逻辑
│   └── db.ts             # Upstash Redis 数据层
├── package.json
└── next.config.js
```

## 自定义域名（可选）

Vercel 后台 → Settings → Domains，填入你的域名，按提示配置 DNS 即可。

## 数据说明

- 使用 **Upstash Redis**（免费版）持久化存储所有测试记录
- 免费额度：每天 1 万次命令，1000 并发连接
- 数据全部存在你自己的 Upstash 账户中，Vercel 无法访问
