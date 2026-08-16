import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-[#FBF8F3] text-[#3A3630] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-lg text-[#7A736A] mb-8">Page Not Found</p>
          <Link
            href="/ja"
            className="inline-block px-6 py-3 rounded-full bg-[#9E8FB8] text-white font-medium hover:opacity-90 transition"
          >
            Go to Home
          </Link>
        </div>
      </body>
    </html>
  );
}
