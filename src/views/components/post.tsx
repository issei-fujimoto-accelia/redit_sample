import type { Child } from "hono/jsx";
import { displayName } from "../../lib/display-name";
import { Edited, Timestamp } from "./common";

export type PostRow = {
  id: number;
  body: string;
  isOpening: boolean;
  authorEmail: string;
  createdAt: string;
  updatedAt: string | null;
};

type PostItemProps = {
  post: PostRow;
  /** スレッド内の通し番号（1 = 本文） */
  no: number;
  /** 本人のときだけ渡す操作（OwnerActions） */
  actions?: Child;
};

export function PostItem({ post: p, no, actions }: PostItemProps) {
  return (
    <li id={`post-${p.id}`} class={p.isOpening ? "post post--opening" : "post"}>
      <span class="post__no" aria-hidden="true">
        {String(no).padStart(2, "0")}
      </span>
      <p class="post__head">
        {p.isOpening && <span class="post__badge">本文</span>}
        <span class="post__author">
          <span class="visually-hidden">投稿者：</span>
          {displayName(p.authorEmail)}
        </span>
        <Timestamp iso={p.createdAt} />
        <Edited updatedAt={p.updatedAt} />
      </p>
      <div class="post__body">{p.body}</div>
      {actions}
    </li>
  );
}

export function PostList({ children }: { children?: Child }) {
  return (
    <ol class="post-list" role="list">
      {children}
    </ol>
  );
}
