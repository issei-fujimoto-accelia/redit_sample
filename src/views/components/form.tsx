import type { Child } from "hono/jsx";
import { FormErrorSummary } from "./common";

type FieldProps = {
  /** フォーム内で一意な ID の接頭辞（同じ画面に複数のフォームがある場合に区別する） */
  formId: string;
  name: string;
  label: string;
  value?: string;
  error?: string;
  /** 上限文字数。補足として表示する */
  max?: number;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  autofocus?: boolean;
};

/** ラベル、入力、補足（上限文字数）、エラー */
export function Field(p: FieldProps) {
  const id = `${p.formId}-${p.name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [p.max ? hintId : null, p.error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name: p.name,
    class: "field__input",
    "aria-invalid": p.error ? "true" : undefined,
    "aria-describedby": describedBy,
    required: p.required,
    disabled: p.disabled,
    autofocus: p.autofocus,
  };
  return (
    <div class="field">
      <label class="field__label" for={id}>
        <span>
          {p.label}
          {!p.required && <span class="field__req">（任意）</span>}
        </span>
        {p.max && (
          <span class="field__hint" id={hintId}>
            {p.max.toLocaleString("en-US")}文字まで
          </span>
        )}
      </label>
      {p.multiline ? (
        <textarea {...common} rows={p.rows ?? 6}>
          {p.value ?? ""}
        </textarea>
      ) : (
        <input {...common} type="text" value={p.value ?? ""} autocomplete="off" />
      )}
      {p.error && (
        <p class="field__error" id={errorId}>
          {p.error}
        </p>
      )}
    </div>
  );
}

type SelectProps = {
  formId: string;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  /** 選択中の値。一致する選択肢に `selected` を付ける（JS なし） */
  value?: string;
  error?: string;
  required?: boolean;
  /** 未選択の選択肢の文言 */
  placeholder?: string;
};

/** `Field` の選択肢版。ラベル、`<select>`、エラー */
export function Select(p: SelectProps) {
  const id = `${p.formId}-${p.name}`;
  const errorId = `${id}-error`;
  const hasValue = p.options.some((o) => o.value === p.value);
  return (
    <div class="field">
      <label class="field__label" for={id}>
        <span>
          {p.label}
          {!p.required && <span class="field__req">（任意）</span>}
        </span>
      </label>
      <div class="field__select">
        <select
          id={id}
          name={p.name}
          class="field__input"
          required={p.required}
          aria-invalid={p.error ? "true" : undefined}
          aria-describedby={p.error ? errorId : undefined}
        >
          <option value="" disabled={p.required} selected={hasValue ? undefined : true} hidden={p.required}>
            {p.placeholder ?? "選んでください"}
          </option>
          {p.options.map((o) => (
            <option value={o.value} selected={o.value === p.value ? true : undefined}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {p.error && (
        <p class="field__error" id={errorId}>
          {p.error}
        </p>
      )}
    </div>
  );
}

type FormProps = {
  action: string;
  title?: string;
  submitLabel: string;
  errors?: string[];
  panel?: boolean;
  children?: Child;
  /** 送信ボタンの隣に置く補助操作 */
  extra?: Child;
};

/** 投稿フォームの枠。エラーの要約を先頭に置く */
export function Form({ action, title, submitLabel, errors, panel, children, extra }: FormProps) {
  return (
    <form method="post" action={action} class={panel ? "form form--panel" : "form"} novalidate>
      {title && <h2 class="form__title">{title}</h2>}
      {errors && <FormErrorSummary errors={errors} />}
      {children}
      <div class="form__actions">
        <button class="button" type="submit">
          {submitLabel}
        </button>
        {extra}
      </div>
    </form>
  );
}

type EditDisclosureProps = {
  label?: string;
  /** エラーのある再描画では開いた状態にする */
  open?: boolean;
  children?: Child;
};

/** `<details>` による編集フォームの開閉（JS 不要） */
export function EditDisclosure({ label = "編集", open, children }: EditDisclosureProps) {
  return (
    <details class="disclosure" open={open}>
      <summary class="button button--quiet button--small">{label}</summary>
      <div class="disclosure__panel">{children}</div>
    </details>
  );
}

type DeleteButtonProps = {
  action: string;
  /** 確認ダイアログの文言 */
  confirm: string;
  label?: string;
};

/** 削除ボタン。送信前に confirm で確認する（唯一のクライアント JS） */
export function DeleteButton({ action, confirm, label = "削除" }: DeleteButtonProps) {
  const message = JSON.stringify(confirm);
  return (
    <form method="post" action={action} class="owner-actions__delete" onsubmit={`return confirm(${message})`}>
      <button class="button button--danger button--small" type="submit">
        {label}
      </button>
    </form>
  );
}

type OwnerActionsProps = {
  /** 作成者本人のときだけ表示する */
  isOwner: boolean;
  edit?: Child;
  editOpen?: boolean;
  editLabel?: string;
  deleteAction?: string;
  deleteConfirm?: string;
};

export function OwnerActions({ isOwner, edit, editOpen, editLabel, deleteAction, deleteConfirm }: OwnerActionsProps) {
  if (!isOwner) return null;
  return (
    <div class="owner-actions">
      {edit && (
        <EditDisclosure open={editOpen} label={editLabel}>
          {edit}
        </EditDisclosure>
      )}
      {deleteAction && <DeleteButton action={deleteAction} confirm={deleteConfirm ?? "削除しますか？"} />}
    </div>
  );
}
