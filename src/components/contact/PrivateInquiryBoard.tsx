'use client';

import { FormEvent, KeyboardEvent, useState } from 'react';
import { isPrivateInquiryEnabled } from '@/lib/supabase/client';

type Locale = 'ja' | 'ko' | 'en';
type Inquiry = { id: string; category: string; title: string; body: string; status: string; admin_reply: string | null; created_at: string; updated_at: string };

const copy = {
  ko: { setup:'비공개 문의함 설정 중입니다. 운영 환경 연결이 완료되면 이용할 수 있습니다.', privacy:'회원가입 없이 임시 아이디와 비밀번호를 직접 정해 문의할 수 있습니다. 같은 조합으로 자기 문의만 확인합니다.', createTab:'문의 등록', lookupTab:'문의 조회', privateId:'임시 아이디', idHelp:'기억하기 쉬운 4~40자', category:'문의 유형', takedown:'삭제 요청', correction:'정보 수정·추가', general:'일반 문의', title:'제목', body:'내용', password:'문의 비밀번호', passwordHelp:'조회할 때 사용할 8자 이상의 비밀번호', submit:'비공개로 등록', created:'문의가 등록되었습니다. 입력한 아이디와 비밀번호를 기억해 주세요.', lookup:'내 문의 확인', reply:'운영자 답변', noReply:'답변을 기다리고 있습니다.', required:'모든 항목을 입력해 주세요.', invalidId:'임시 아이디는 4~40자로 입력해 주세요.', invalidPassword:'문의 비밀번호는 8자 이상이어야 합니다.', notFound:'아이디 또는 비밀번호가 일치하는 문의가 없습니다.', genericError:'처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', working:'처리 중…' },
  ja: { setup:'非公開お問い合わせボックスを設定中です。接続完了後に利用できます。', privacy:'会員登録なしで仮IDとパスワードを設定できます。同じ組み合わせで自分の投稿のみ確認できます。', createTab:'お問い合わせ登録', lookupTab:'お問い合わせ確認', privateId:'仮ID', idHelp:'覚えやすい4〜40文字', category:'種類', takedown:'削除要請', correction:'情報修正・追加', general:'一般', title:'件名', body:'内容', password:'お問い合わせパスワード', passwordHelp:'確認時に使用する8文字以上のパスワード', submit:'非公開で送信', created:'登録しました。入力したIDとパスワードを保管してください。', lookup:'自分のお問い合わせを確認', reply:'運営者からの回答', noReply:'回答をお待ちください。', required:'すべての項目を入力してください。', invalidId:'仮IDは4〜40文字で入力してください。', invalidPassword:'パスワードは8文字以上必要です。', notFound:'IDまたはパスワードに一致するお問い合わせはありません。', genericError:'処理できませんでした。しばらくしてから再度お試しください。', working:'処理中…' },
  en: { setup:'The private inquiry box is being configured. It will be available after the service is connected.', privacy:'No account is required. Choose a temporary ID and password, then use the same pair to view only your inquiries.', createTab:'Submit inquiry', lookupTab:'Check inquiries', privateId:'Temporary ID', idHelp:'4–40 memorable characters', category:'Category', takedown:'Takedown request', correction:'Correction or addition', general:'General inquiry', title:'Title', body:'Message', password:'Inquiry password', passwordHelp:'At least 8 characters; required to check your inquiries', submit:'Submit privately', created:'Submitted. Keep the ID and password you entered.', lookup:'View my inquiries', reply:'Administrator reply', noReply:'Waiting for a reply.', required:'Complete every field.', invalidId:'The temporary ID must be 4–40 characters.', invalidPassword:'The inquiry password must be at least 8 characters.', notFound:'No inquiries match that ID and password.', genericError:'The request could not be completed. Please try again.', working:'Working…' },
} as const;

const inputClass = 'mt-2 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 font-normal';

export function PrivateInquiryBoard({ locale }: { locale: string }) {
  const lang = (locale === 'ja' || locale === 'en' ? locale : 'ko') as Locale;
  const t = copy[lang];
  const [mode, setMode] = useState<'create' | 'lookup'>('create');
  const [privateId, setPrivateId] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isPrivateInquiryEnabled()) return <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6 text-sm text-[var(--ink-soft)]">{t.setup}</div>;

  function validateAccess() {
    const idLength = Array.from(privateId.trim()).length;
    if (idLength < 4 || idLength > 40) { setMessage(t.invalidId); return false; }
    if (password.length < 8 || password.length > 128) { setMessage(t.invalidPassword); return false; }
    return true;
  }

  function selectMode(nextMode: 'create' | 'lookup') {
    setMode(nextMode);
    setMessage('');
    setInquiries([]);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextMode = event.key === 'ArrowLeft' || event.key === 'Home' ? 'create' : 'lookup';
    selectMode(nextMode);
    requestAnimationFrame(() => document.getElementById(`inquiry-${nextMode}-tab`)?.focus());
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault(); if (!validateAccess()) return;
    if (!title.trim() || !body.trim()) { setMessage(t.required); return; }
    setBusy(true); setMessage('');
    let response: Response;
    try {
      response = await fetch('/api/inquiries/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ privateId: privateId.trim(), password, category, title: title.trim(), body: body.trim() }) });
    } catch {
      setBusy(false); setMessage(t.genericError); return;
    }
    setBusy(false); if (!response.ok) { setMessage(t.genericError); return; }
    setTitle(''); setBody(''); setMessage(t.created);
  }

  async function handleLookup(event: FormEvent) {
    event.preventDefault(); if (!validateAccess()) return;
    setBusy(true); setMessage(''); setInquiries([]);
    let response: Response;
    try {
      response = await fetch('/api/inquiries/read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ privateId: privateId.trim(), password }) });
    } catch {
      setBusy(false); setMessage(t.genericError); return;
    }
    const data = response.ok ? await response.json() : null;
    setBusy(false); if (!Array.isArray(data) || data.length === 0) { setMessage(t.notFound); return; }
    setInquiries(data as Inquiry[]);
  }

  const accessFields = <>
    <label className="block text-sm font-semibold">{t.privateId}<input maxLength={40} autoComplete="off" value={privateId} onChange={(e) => setPrivateId(e.target.value)} className={inputClass} /><span className="mt-1 block text-xs font-normal text-[var(--ink-soft)]">{t.idHelp}</span></label>
    <label className="block text-sm font-semibold">{t.password}<input type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} /><span className="mt-1 block text-xs font-normal text-[var(--ink-soft)]">{t.passwordHelp}</span></label>
  </>;

  return <section className="space-y-6">
    <p className="rounded-xl bg-[color-mix(in_oklab,var(--g-brand)_9%,white)] p-4 text-sm text-[var(--ink-soft)]">{t.privacy}</p>
    <div className="flex gap-2" role="tablist">
      <button id="inquiry-create-tab" type="button" role="tab" aria-selected={mode === 'create'} aria-controls="inquiry-create-panel" tabIndex={mode === 'create' ? 0 : -1} onKeyDown={handleTabKeyDown} onClick={() => selectMode('create')} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'create' ? 'bg-[var(--g-brand)] text-white' : 'bg-[var(--paper-deep)]'}`}>{t.createTab}</button>
      <button id="inquiry-lookup-tab" type="button" role="tab" aria-selected={mode === 'lookup'} aria-controls="inquiry-lookup-panel" tabIndex={mode === 'lookup' ? 0 : -1} onKeyDown={handleTabKeyDown} onClick={() => selectMode('lookup')} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'lookup' ? 'bg-[var(--g-brand)] text-white' : 'bg-[var(--paper-deep)]'}`}>{t.lookupTab}</button>
    </div>
    {mode === 'create' ? <div id="inquiry-create-panel" role="tabpanel" aria-labelledby="inquiry-create-tab"><form onSubmit={handleCreate} className="space-y-4">{accessFields}<label className="block text-sm font-semibold">{t.category}<select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}><option value="takedown">{t.takedown}</option><option value="correction">{t.correction}</option><option value="general">{t.general}</option></select></label><label className="block text-sm font-semibold">{t.title}<input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></label><label className="block text-sm font-semibold">{t.body}<textarea maxLength={5000} rows={7} value={body} onChange={(e) => setBody(e.target.value)} className={`${inputClass} resize-y`} /></label><button disabled={busy} className="rounded-xl bg-[var(--g-brand)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? t.working : t.submit}</button></form></div> : <div id="inquiry-lookup-panel" role="tabpanel" aria-labelledby="inquiry-lookup-tab" className="space-y-6"><form onSubmit={handleLookup} className="space-y-4">{accessFields}<button disabled={busy} className="rounded-xl bg-[var(--g-brand)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? t.working : t.lookup}</button></form><div className="space-y-4">{inquiries.map((item) => <article key={item.id} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{item.title}</h3><span className="count-pill">{item.status}</span></div><time className="mt-1 block text-xs text-[var(--ink-soft)]">{new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(item.created_at))}</time><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p><div className="mt-5 rounded-xl bg-[var(--paper-deep)] p-4"><strong className="text-sm">{t.reply}</strong><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink-soft)]">{item.admin_reply || t.noReply}</p></div></article>)}</div></div>}
    {message && <p role="alert" className="text-sm text-[var(--g-brand)]">{message}</p>}
  </section>;
}
