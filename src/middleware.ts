import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const KLP48_TO_AKB48_MERGES: Record<string, string> = {
  'klp48-gyouten-yurina': 'akb48-gyouten-yurina',
  'klp48-kurosu-haruka': 'akb48-kurosu-haruka',
  'klp48-yamane-suzuha': 'akb48-yamane-suzuha',
};

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Redirect merged KLP48 member pages to their AKB48 equivalents (301 permanent)
  const memberMatch = pathname.match(/^\/(ja|ko|en)\/m\/(klp48-[a-z-]+)$/);
  if (memberMatch) {
    const locale = memberMatch[1];
    const oldId = memberMatch[2];
    if (locale && oldId) {
      const newId = KLP48_TO_AKB48_MERGES[oldId];
      if (newId) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/m/${newId}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

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
