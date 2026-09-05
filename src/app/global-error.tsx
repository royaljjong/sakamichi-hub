'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('global error boundary:', error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
          background: '#FBF8F3',
          color: '#3A3630',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B27B4E', fontWeight: 600, marginBottom: '8px' }}>
            System Error
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
            アプリケーションエラー / 애플리케이션 오류 / Application Error
          </h1>
          <p style={{ fontSize: '13px', color: '#6b615a', lineHeight: 1.6, marginBottom: '24px' }}>
            致命的なエラーが発生しました。ページを再読み込みしてください。<br />
            치명적인 오류가 발생했습니다. 페이지를 새로고침해 주세요.<br />
            A fatal error occurred. Please reload the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: '#B27B4E',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload / 再読み込み / 새로고침
          </button>
          {error.digest && (
            <p style={{ marginTop: '20px', fontSize: '10px', color: '#B5ADA2' }}>
              digest: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
