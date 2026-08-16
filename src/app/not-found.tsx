import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-[#FBF8F3] text-[#3A3630] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Slope Line */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none opacity-30">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 240"
            preserveAspectRatio="none"
          >
            <path
              d="M0,168 C240,120 480,196 720,152 C960,108 1200,178 1440,140 L1440,240 L0,240 Z"
              fill="#9E8FB8"
            />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-md p-8 rounded-3xl bg-white/80 backdrop-blur-md shadow-xl border border-stone-200">
          <span className="text-xs uppercase tracking-widest text-[#9E8FB8] font-bold mb-2 block">
            404 Not Found
          </span>
          <h1 className="text-4xl font-bold mb-3 font-serif">
            ページが見つかりません
          </h1>
          <p className="text-sm text-[#7A736A] mb-8 leading-relaxed">
            お探しのページは移動または削除された可能性があります。
          </p>
          <Link
            href="/ja"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9E8FB8] text-white text-sm font-semibold hover:opacity-90 transition shadow-md"
          >
            ホームへ戻る →
          </Link>
        </div>
      </body>
    </html>
  );
}
