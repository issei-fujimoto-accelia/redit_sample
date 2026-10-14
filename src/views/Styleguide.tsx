import type { Child } from "hono/jsx";
import { communityHue } from "../lib/community-hue";
import { CommunityChip, CommunityGrid } from "./components/community";
import { EmptyState, FormErrorSummary, Notice, Timestamp } from "./components/common";
import { DeleteButton, EditDisclosure, Field, Form, OwnerActions, Select } from "./components/form";
import { PostItem, PostList, type PostRow } from "./components/post";
import { Layout, PageHeader, PostButton, SiteHeader } from "./components/site";
import { Pagination, ThreadList, ThreadListItem, type ThreadRow } from "./components/thread";

/** スタイルガイド（UI_GUIDELINES §8.3）。全部品と §6.3 の状態を固定データで並べる */

const LONG_TITLE =
  "長いタイトルの表示確認：" +
  "掲示板のスレッド一覧で二百文字近いタイトルがどのように折り返され、投稿数や最終投稿日時の列と干渉せずに読めるかを確かめるための文章です。".repeat(2) +
  "最後まで崩れずに表示されることを確認します。";
const NO_BREAK = "https://example.com/" + "averyveryverylongpathsegmentwithoutanybreakopportunity".repeat(4);
const NAME_50 = "五十字のコミュニティ名を確認するための長い名前の例です。表示が崩れないかを見ます。あいうえおかきく";

const communities = [
  { id: 1, name: "設計とアーキテクチャ", description: "システム設計、データモデル、技術判断の記録について話す場所。" },
  { id: 2, name: "Cloudflare Workers", description: "Workers、D1、Access の使い方とハマりどころ。" },
  { id: 3, name: "雑談", description: "" },
  { id: 4, name: NAME_50, description: "説明が長い場合の表示。".repeat(30) },
  { id: 5, name: "読書会", description: "月に一冊、技術書を読んで感想を書きます。" },
  { id: 6, name: "Typography", description: "和欧混植、約物、行間の話。" },
];

const t = (over: Partial<ThreadRow> & { id: number }): ThreadRow => ({
  title: "D1 のインデックス設計で迷っていること",
  communityId: 1,
  communityName: "設計とアーキテクチャ",
  authorEmail: "alice@example.com",
  postCount: 3,
  lastPostedAt: "2026-10-12T23:41:00.000Z",
  updatedAt: null,
  ...over,
});

const threads: ThreadRow[] = [
  t({ id: 101, postCount: 128, lastPostedAt: "2026-10-13T02:10:00.000Z" }),
  t({ id: 102, title: "wrangler dev で Access をどう再現するか", communityId: 2, communityName: "Cloudflare Workers", authorEmail: "bob@example.com", postCount: 12, updatedAt: "2026-10-12T10:00:00.000Z" }),
  t({ id: 103, title: "今週読んだ本", communityId: 5, communityName: "読書会", authorEmail: "carol@example.com", postCount: 1, lastPostedAt: "2026-10-11T15:00:00.000Z" }),
  t({ id: 104, title: LONG_TITLE, communityId: 4, communityName: NAME_50, authorEmail: "a.very.long.local.part.for.display.name@example.com", postCount: 9999, lastPostedAt: "2026-01-01T00:00:00.000Z" }),
  t({ id: 105, title: NO_BREAK, communityId: 6, communityName: "Typography", postCount: 42 }),
];

const posts: PostRow[] = [
  { id: 1, isOpening: true, authorEmail: "alice@example.com", createdAt: "2026-10-12T01:00:00.000Z", updatedAt: "2026-10-12T02:00:00.000Z", body: "スレッドの本文です。\n改行は保持されます。\n\n<script>alert('XSS')</script> はそのまま文字列として表示されます。" },
  { id: 2, isOpening: false, authorEmail: "bob@example.com", createdAt: "2026-10-12T03:30:00.000Z", updatedAt: null, body: "返信です。短い返信。" },
  { id: 3, isOpening: false, authorEmail: "carol@example.com", createdAt: "2026-10-12T15:00:00.000Z", updatedAt: null, body: NO_BREAK },
  { id: 4, isOpening: false, authorEmail: "alice@example.com", createdAt: "2026-10-13T00:00:00.000Z", updatedAt: null, body: "改行の多い本文\n\n\n\n\n\n空行が続いても崩れない。" },
];

function Section({ name, title, children }: { name: string; title: string; children?: Child }) {
  return (
    <section class="sg-section" aria-labelledby={`sg-${name}`}>
      <h2 id={`sg-${name}`}>
        <code>{name}</code>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Case({ label, children }: { label: string; children?: Child }) {
  return (
    <div class="sg-case">
      <span class="sg-case__label">{label}</span>
      {children}
    </div>
  );
}

const SWATCHES = ["paper", "paper-2", "ink", "ink-2", "line", "accent", "danger"];

export function Styleguide({ user }: { user: string }) {
  return (
    <Layout title="スタイルガイド" user={user}>
      <PageHeader
        eyebrow="開発用 · AUTH_MODE=dev のみ"
        title={
          <>
            <span class="latin">Styleguide</span> スタイルガイド
          </>
        }
        description={"共通部品と、UI_GUIDELINES §6.3 の状態を固定データで並べたページ。\n部品の品質をこのページでセルフチェックする。"}
      />

      <Section name="tokens" title="色・書体">
        <ul class="sg-swatches" role="list">
          {SWATCHES.map((s) => (
            <li class="sg-swatch">
              <span class="sg-swatch__color" style={`background: var(--color-${s})`}></span>
              <code>--color-{s}</code>
            </li>
          ))}
        </ul>
        <Case label="コミュニティ色相（ID 1〜12）">
          <div class="sg-row">
            {Array.from({ length: 12 }, (_, i) => (
              <CommunityChip id={i + 1} name={`ID ${i + 1} · ${communityHue(i + 1)}°`} />
            ))}
          </div>
        </Case>
        <Case label="文字サイズ（--step-5 〜 --step--1）">
          <div class="sg-type">
            <p style="font-size: var(--step-5); line-height: 1.2; font-weight: 700">議論の索引 Index</p>
            <p style="font-size: var(--step-3); font-weight: 700">見出しは大きさの差だけで階層を示す</p>
            <p style="font-size: var(--step-1)">本文の先頭（スレッドの本文）は一段大きく組む。</p>
            <p>
              本文は 16px 以上、行間 1.8。和文はシステムのゴシック体、欧文と数字は <span class="latin">Fraunces</span>{" "}
              で組む。<span class="num latin">0123456789</span>
            </p>
            <p style="font-size: var(--step--1)" class="muted">
              メタ情報：<Timestamp iso="2026-10-13T00:00:00.000Z" />
            </p>
          </div>
        </Case>
      </Section>

      <Section name="states" title="状態（UI_GUIDELINES §6.1〜6.2）">
        <Case label="SiteHeader（現在地：ホーム）">
          <div style="border: var(--line-width) solid var(--color-line)">
            <SiteHeader user={user} current="home" />
          </div>
        </Case>
        <Case label="PostButton（ヘッダーの「＋ 投稿する」。モバイルではアイコンのみ）">
          <div class="sg-row">
            <PostButton />
            <PostButton communityId={2} />
          </div>
        </Case>
        <Case label="ボタン：通常 / ホバー / フォーカス / 押下 / 無効">
          <div class="sg-row">
            <button class="button" type="button">通常</button>
            <button class="button is-hover" type="button">ホバー</button>
            <button class="button is-focus" type="button">フォーカス</button>
            <button class="button is-active" type="button">押下</button>
            <button class="button" type="button" disabled>無効</button>
          </div>
          <div class="sg-row" style="margin-block-start: var(--space-3)">
            <button class="button button--quiet" type="button">控えめ</button>
            <button class="button button--quiet is-hover" type="button">ホバー</button>
            <button class="button button--danger" type="button">削除</button>
            <button class="button button--danger is-hover" type="button">削除（ホバー）</button>
            <button class="button button--danger is-focus" type="button">削除（フォーカス）</button>
          </div>
        </Case>
        <Case label="リンク・チップ：通常 / ホバー / フォーカス">
          <div class="sg-row">
            <a href="#">通常のリンク</a>
            <a class="is-hover" href="#">ホバー</a>
            <a class="is-focus" href="#">フォーカス</a>
            <CommunityChip id={2} name="Cloudflare Workers" />
            <a class="chip is-hover" href="#" style={`--community-hue: ${communityHue(2)}`}>
              <span class="chip__text">チップ（ホバー）</span>
            </a>
          </div>
        </Case>
        <Case label="入力：通常 / ホバー / フォーカス">
          <div style="display: grid; gap: var(--space-3); max-inline-size: var(--measure)">
            <input class="field__input" aria-label="通常" value="通常" />
            <input class="field__input is-hover" aria-label="ホバー" value="ホバー" />
            <input class="field__input is-focus" aria-label="フォーカス" value="フォーカス" />
          </div>
        </Case>
        <Case label="スレッド行：通常 / ホバー">
          <ol class="thread-list" role="list">
            <ThreadListItem thread={threads[0]!} showCommunity />
            <li class="thread-item is-hover" style={`--community-hue: ${communityHue(2)}`}>
              <p class="thread-item__meta">
                <span class="thread-item__no" aria-hidden="true"></span>
                <CommunityChip id={2} name="Cloudflare Workers" />
              </p>
              <h3 class="thread-item__title">
                <a class="thread-item__link" href="#">ホバー中の行（下線が伸び、背景が淡く入る）</a>
              </h3>
              <p class="thread-item__byline">bob</p>
              <p class="thread-item__figures">
                <span class="thread-item__count">7</span>
                <span class="thread-item__count-label">件の投稿</span>
              </p>
            </li>
          </ol>
        </Case>
        <Case label="返信直後の投稿（:target の強調）">
          <PostList>
            <li class="post is-target" style="animation: none; background: color-mix(in oklch, var(--color-accent) 12%, transparent)">
              <span class="post__no" aria-hidden="true">05</span>
              <p class="post__head">
                <span class="post__author">alice</span>
                <Timestamp iso="2026-10-13T03:00:00.000Z" />
              </p>
              <div class="post__body">投稿した直後は、この投稿に移動して一時的に強調する。</div>
            </li>
          </PostList>
        </Case>
        <Case label="編集フォームの開閉：閉 / 開">
          <div class="sg-row" style="align-items: flex-start">
            <EditDisclosure>
              <p>閉じた状態</p>
            </EditDisclosure>
          </div>
          <div style="margin-block-start: var(--space-3)">
            <EditDisclosure open>
              <Form action="#" submitLabel="保存">
                <Field formId="sg-state" name="title" label="タイトル" value="開いた状態" max={200} required />
              </Form>
            </EditDisclosure>
          </div>
        </Case>
      </Section>

      <Section name="PageHeader" title="ページ見出し">
        <Case label="通常">
          <PageHeader eyebrow="コミュニティ一覧" title="コミュニティ" description="テーマごとの議論の場。" />
        </Case>
        <Case label="コミュニティ（色相・本人の操作あり）">
          <PageHeader
            eyebrow={<CommunityChip id={2} name="Cloudflare Workers" />}
            title="Cloudflare Workers"
            description={"Workers、D1、Access の使い方とハマりどころ。\n改行を含む説明。"}
            hue={communityHue(2)}
            actions={
              <OwnerActions
                isOwner
                edit={<p class="muted">編集フォーム</p>}
                deleteAction="#"
                deleteConfirm="このコミュニティを削除しますか？"
              />
            }
          />
        </Case>
        <Case label="極端なデータ（50字の名前）">
          <PageHeader title={NAME_50} hue={communityHue(4)} />
        </Case>
      </Section>

      <Section name="CommunityChip / CommunityCard" title="コミュニティ">
        <Case label="CommunityChip">
          <div class="sg-row">
            {communities.map((c) => (
              <CommunityChip id={c.id} name={c.name} />
            ))}
          </div>
        </Case>
        <Case label="CommunityCard（説明なし・長い説明・50字の名前を含む）">
          <CommunityGrid communities={communities} />
        </Case>
        <Case label="空の状態（コミュニティ0件）">
          <EmptyState title="コミュニティはまだありません" body="最初のコミュニティを作って、議論の場を開きましょう。" />
        </Case>
      </Section>

      <Section name="ThreadList / ThreadListItem / Pagination" title="スレッド一覧">
        <Case label="ホーム（コミュニティチップあり、編集済み、極端なデータ）">
          <ThreadList threads={threads} showCommunity page={1} hasNext baseUrl="/" />
        </Case>
        <Case label="コミュニティページ（チップなし、2ページ目）">
          <ThreadList threads={threads.slice(0, 2)} showCommunity={false} page={2} hasNext={false} baseUrl="/c/1" />
        </Case>
        <Case label="1件のみ">
          <ThreadList threads={threads.slice(2, 3)} showCommunity={false} page={1} hasNext={false} baseUrl="/c/5" />
        </Case>
        <Case label="空の状態（スレッド0件）">
          <ThreadList
            threads={[]}
            showCommunity={false}
            page={1}
            hasNext={false}
            baseUrl="/c/3"
            emptyBody="下のフォームから、最初のスレッドを立てましょう。"
          />
        </Case>
        <Case label="範囲外のページ">
          <ThreadList threads={[]} showCommunity page={9} hasNext={false} baseUrl="/" />
        </Case>
        <Case label="Pagination（中間のページ）">
          <Pagination page={3} hasNext baseUrl="/" />
        </Case>
      </Section>

      <Section name="PostItem" title="投稿">
        <PostList>
          {posts.map((p, i) => (
            <PostItem
              post={p}
              no={i + 1}
              actions={
                p.authorEmail === user ? (
                  <OwnerActions
                    isOwner
                    edit={
                      <Form action="#" submitLabel="保存">
                        <Field formId={`sg-edit-${p.id}`} name="body" label="本文" value={p.body} max={10000} required multiline />
                      </Form>
                    }
                    deleteAction={p.isOpening ? undefined : "#"}
                    deleteConfirm="この返信を削除しますか？"
                  />
                ) : undefined
              }
            />
          ))}
        </PostList>
      </Section>

      <Section name="Field / Form / FormErrorSummary" title="フォーム">
        <Case label="通常">
          <Form action="#" title="コミュニティを作る" submitLabel="作成する" panel>
            <Field formId="sg-new" name="name" label="名前" max={50} required />
            <Field formId="sg-new" name="description" label="説明" max={500} multiline rows={3} />
          </Form>
        </Case>
        <Case label="入力エラー（400）">
          <Form
            action="#"
            title="スレッドを立てる"
            submitLabel="投稿する"
            panel
            errors={["タイトルを入力してください。", "本文は10,000文字以内で入力してください。"]}
          >
            <Field formId="sg-err" name="title" label="タイトル" max={200} required value="" error="タイトルを入力してください。" />
            <Field formId="sg-err" name="body" label="本文" max={10000} required multiline value={"長い本文…"} error="本文は10,000文字以内で入力してください。" />
          </Form>
        </Case>
        <Case label="Select（スレッド作成の投稿先）：未選択 / 選択済み / エラー">
          <div style="display: grid; gap: var(--space-5); max-inline-size: var(--column)">
            <Select formId="sg-sel1" name="c" label="コミュニティ" required options={communities.map((c) => ({ value: String(c.id), label: c.name }))} />
            <Select formId="sg-sel2" name="c" label="コミュニティ" required value="2" options={communities.map((c) => ({ value: String(c.id), label: c.name }))} />
            <Select formId="sg-sel3" name="c" label="コミュニティ" required error="投稿先のコミュニティを選んでください。" options={communities.map((c) => ({ value: String(c.id), label: c.name }))} />
          </div>
        </Case>
        <Case label="重複（409）">
          <FormErrorSummary errors={["同じ名前のコミュニティがすでにあります。"]} />
        </Case>
        <Case label="無効状態">
          <div class="sg-row">
            <button class="button" type="button" disabled>
              送信中
            </button>
            <button class="button button--quiet" type="button">
              キャンセル
            </button>
          </div>
          <div style="margin-block-start: var(--space-4); max-inline-size: var(--measure)">
            <Field formId="sg-dis" name="x" label="無効な入力" value="編集できません" disabled required />
          </div>
        </Case>
      </Section>

      <Section name="OwnerActions / EditDisclosure / DeleteButton" title="本人の操作">
        <Case label="本人（編集・削除）">
          <OwnerActions
            isOwner
            edit={
              <Form action="#" submitLabel="保存">
                <Field formId="sg-title" name="title" label="タイトル" value="D1 のインデックス設計で迷っていること" max={200} required />
              </Form>
            }
            deleteAction="#"
            deleteConfirm="このスレッドを削除しますか？"
          />
        </Case>
        <Case label="エラー付きで開いた状態">
          <EditDisclosure open>
            <Form action="#" submitLabel="保存" errors={["同じ名前のコミュニティがすでにあります。"]}>
              <Field formId="sg-open" name="name" label="名前" value="雑談" max={50} required error="同じ名前のコミュニティがすでにあります。" />
            </Form>
          </EditDisclosure>
        </Case>
        <Case label="削除のみ">
          <div class="sg-row">
            <DeleteButton action="#" confirm="この返信を削除しますか？" />
          </div>
        </Case>
        <Case label="他人（何も表示しない）">
          <OwnerActions isOwner={false} deleteAction="#" />
          <p class="muted">（操作は表示されない）</p>
        </Case>
      </Section>

      <Section name="Notice" title="通知">
        <Case label="削除できない理由（409）">
          <Notice tone="error" title="このスレッドは削除できません">
            返信が残っているスレッドは削除できません。返信がすべて削除されると、本文ごと削除できます。
          </Notice>
        </Case>
        <Case label="情報">
          <Notice title="編集しました" />
        </Case>
      </Section>

      <Section name="ErrorPage" title="エラーページ">
        <ul role="list" class="sg-row">
          {[403, 404, 500, 503].map((s) => (
            <li>
              <a href={`/_styleguide/error/${s}`}>{s} を表示</a>
            </li>
          ))}
        </ul>
      </Section>
    </Layout>
  );
}
