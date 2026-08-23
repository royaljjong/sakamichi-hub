import Link from 'next/link';

// Root-level not-found renders outside the [locale] layout (no next-intl context).
// We default to Japanese and hardcode translations for all three locales.

export default function NotFound() {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-[#FBF8F3] text-[#3A3630] flex items-center justify-center p-6 relative overflow-hidden">
        {/* SlopeLine decorative gradient bottom */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom right, transparent 45%, rgba(158,143,184,0.18) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-25"
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 128"
            preserveAspectRatio="none"
          >
            <path
              d="M0,80 C320,40 640,100 960,60 C1200,28 1320,88 1440,64 L1440,128 L0,128 Z"
              fill="#9E8FB8"
            />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-lg w-full p-8 sm:p-10 rounded-3xl bg-white/80 backdrop-blur-md shadow-xl border border-stone-200">
          {/* Badge */}
          <span className="inline-block text-xs uppercase tracking-widest text-[#9E8FB8] font-bold mb-4 px-3 py-1 rounded-full bg-[#9E8FB8]/10 border border-[#9E8FB8]/30">
            404 Not Found
          </span>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-serif leading-snug">
            ページが見つかりません
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[#7A736A] mb-1 leading-relaxed">
            お探しのページは移動または削除された可能性があります。
          </p>
          <p className="text-xs text-[#9E8FB8] font-medium mb-8">
            URLが正しいかご確認ください
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/ja"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#9E8FB8] text-white text-sm font-semibold hover:opacity-90 transition shadow-md"
            >
              ホームへ戻る →
            </Link>
            <Link
              href="/ja/search"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-[#9E8FB8] text-sm font-semibold border border-[#9E8FB8]/50 hover:bg-[#9E8FB8]/10 transition"
            >
              メンバーを検索
            </Link>
          </div>

          {/* Group chips */}
          <div>
            <p className="text-xs text-[#7A736A] mb-3 font-medium uppercase tracking-wider">
              グループを選ぶ
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { id: 'nogizaka46', label: '乃木坂46' },
                { id: 'sakurazaka46', label: '櫻坂46' },
                { id: 'hinatazaka46', label: '日向坂46' },
                { id: 'akb48', label: 'AKB48' },
              ].map((g) => (
                <Link
                  key={g.id}
                  href={`/ja/g/${g.id}`}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F3EFF9] text-[#6B5EA0] border border-[#9E8FB8]/30 hover:bg-[#9E8FB8]/20 transition"
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
