import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Serve the default locale at the root path WITHOUT a redirect so that
  // Google AdSense (and other verifiers) can find the ad script + meta tags
  // in the response HTML at https://sakamichi-hub.vercel.app/ itself.
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}`;
    return NextResponse.rewrite(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(ja|ko|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};
