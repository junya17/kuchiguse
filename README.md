# 口ぐせ — Workers 版

## 構成

```
kuchiguse/
├── public/
│   └── index.html      # アプリ本体
├── src/
│   └── index.js        # Worker。/api/gen を処理し、他は静的配信
├── wrangler.jsonc      # Worker 設定
└── README.md
```

前回の Pages 版（`functions/api/gen.js`）とは別方式。
Workers では `functions/` は読まれないため、Worker 本体で
ルーティングする形に変更してある。

---

## デプロイ

### A. ダッシュボードから（Git連携）

1. 下記を GitHub に push
2. Cloudflare → **Workers & Pages** → **Create** → **Workers** → **Import a repository**
3. リポジトリを選択
4. ビルド設定:
   - **Build command**: 空欄
   - **Deploy command**: `npx wrangler deploy`
5. デプロイ後、**Settings → Variables and Secrets → Add**
   - Type: **Secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...`
6. **再デプロイする**（Secret は既存デプロイに反映されないため）

### B. 手元から直接（こちらが速い）

```bash
npm install -g wrangler
wrangler login

cd kuchiguse
wrangler secret put ANTHROPIC_API_KEY   # 貼り付けてEnter
wrangler deploy
```

`https://kuchiguse.<自分のサブドメイン>.workers.dev` が出る。

---

## ローカルで試す

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
wrangler dev
```

`.dev.vars` は `.gitignore` 済み。絶対に push しないこと。

---

## 確認

アプリを開いて一文入れる。

| 症状 | 原因 |
|---|---|
| 生成が動く | 完了 |
| 404 | `wrangler.jsonc` の `main` のパス違い |
| 500 `ANTHROPIC_API_KEY is not set` | Secret 未設定、または設定後に再デプロイしていない |
| 401 | キーが無効 |

---

## 独自ドメイン

Worker の **Settings → Domains & Routes → Add → Custom domain**。
Cloudflare で DNS 管理していれば数分で有効。

## iPhoneのホーム画面に置く

Safariで開く → 共有 → **ホーム画面に追加**

---

## 注意

### 濫用対策
公開URLなので、URLを知る誰でも `/api/gen` を叩ける＝自分のキーで課金される。
入力300文字の上限は入れてあるが、確実に塞ぐなら **Cloudflare Access**（Zero Trust → Access controls → Applications）で
自分のメールアドレスのみ許可する。無料枠で足りる。

### 費用
1回の生成で0.2〜0.3円程度。1日20回で月200円以下。

### プロンプト調整
`public/index.html` 内の `const SYS = ...` が生成プロンプト。
返ってくる英語が自分の口に合わないと感じたら、ここに規則を1行足す。
