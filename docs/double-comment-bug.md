# コメント二重表示バグ 修正プラン

更新日: 2026-02-07

## 結論（先に）

現状コードを見る限り、`DB重複` より **UI側の二重描画（描画ゴースト / race）** が有力です。
特に次の症状が一致しています。

- リロードで直る
- DevTools を開く（= リサイズ / 再レイヤー化）と直る
- Realtime / optimistic / polling を消しても残る

つまり、まず「データ重複」と「描画重複」を分離して検証するのが最短です。

## まずやる切り分け（10分）

1. `CommentSection` の各行に `data-comment-id` を付ける。
2. 描画時に `comments.length` と `new Set(comments.map(c => String(c.id))).size` をログ出力する。
3. 同時に DOM 側の件数 `document.querySelectorAll('[data-comment-id="..."]').length` を確認する。

判定基準:

- `state件数=1` なのに `DOM見た目だけ2件` → 描画ゴースト
- `state件数=2` かつ `idが別` → データ経路で重複流入

## 実装修正プラン

### 1. `App.jsx` でコメント配列を正規化してから state に入れる

`setComments(data)` をそのまま使わず、必ず正規化関数を通す。

```js
const normalizeComments = (rows = []) => {
  const map = new Map();
  for (const row of rows) {
    if (!row || row.id == null) continue;
    const id = String(row.id); // number/string 差分吸収
    if (!map.has(id)) {
      map.set(id, { ...row, id });
    }
  }
  return [...map.values()].sort((a, b) => {
    const pa = Number(a.ptime) || 0;
    const pb = Number(b.ptime) || 0;
    if (pa !== pb) return pa - pb;
    const ca = new Date(a.created_at || 0).getTime();
    const cb = new Date(b.created_at || 0).getTime();
    if (ca !== cb) return ca - cb;
    return a.id.localeCompare(b.id);
  });
};
```

`fetchComments` 側:

```js
if (data) {
  const normalized = normalizeComments(data);
  console.log('[fetchComments]', {
    raw: data.length,
    normalized: normalized.length,
    ids: normalized.map(c => c.id),
  });
  setComments(normalized);
}
```

### 2. `fetchComments` の競合（古いレスポンス上書き）を防ぐ

同時実行された fetch のうち、最後のリクエストだけ反映する。

```js
const fetchSeqRef = useRef(0);

const fetchComments = useCallback(async (showLoading = false) => {
  if (!projectId) return;
  const seq = ++fetchSeqRef.current;
  if (showLoading) setIsLoadingComments(true);

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('project_uuid', projectId)
    .order('ptime', { ascending: true });

  if (seq !== fetchSeqRef.current) return; // stale response
  if (error) {
    console.error('[fetchComments] error', error);
  } else {
    setComments(normalizeComments(data || []));
  }
  setIsLoadingComments(false);
}, [projectId]);
```

### 3. 投稿後リフレッシュを `await` して送信連打をさらに抑制

`CommentSection` の `handleSubmit` で `onRefreshComments()` を await する。

```js
if (!error) {
  if (onRefreshComments) {
    await onRefreshComments();
  }
}
```

### 4. 描画ゴースト対策（有力）

以下を順に試して、再現が止まるか確認する。

1. `CommentSection` ルートの `backdrop-blur-sm` を外す。
2. サイドバー親（`App.jsx`）の常時 `transform` を外す（必要なときだけ付ける）。
3. コメント行に `style={{ backfaceVisibility: 'hidden' }}` を試す。
4. `CommentSection` に `key={projectId}` を付けてプロジェクト切替時に完全再マウントする。

## 最短パッチ候補（優先度順）

1. `normalizeComments` + `fetch競合ガード` を `src/App.jsx` に入れる。
2. `onRefreshComments` を `await` する（`src/components/CommentSection.jsx`）。
3. `backdrop-blur-sm` と常時 `transform` を一時停止して描画バグ切り分け。

## 検証手順（必須）

1. `npm run dev` で再現確認。
2. 同じ操作を `npm run build && npx vite preview` で確認。
3. Chrome / Safari で比較。
4. DevTools 閉/開の両方で確認。
5. 投稿ごとに次を記録:
   - `raw件数`
   - `normalized件数`
   - 描画 badge 件数
   - 実 DOM ノード件数

## 期待する完了条件

- 1回投稿で `state=1件増`、`DOM=1件増`、`DB=1行増` が常に一致する。
- DevTools 開閉やウィンドウリサイズで表示件数が変化しない。
- `npm run dev` と `vite preview` の両方で再発しない。

## 対象ファイル

- `src/App.jsx`
- `src/components/CommentSection.jsx`
- `docs/double-comment-bug.md`
