import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://sakamichi-hub.vercel.app'),
};

export default function GroupRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
