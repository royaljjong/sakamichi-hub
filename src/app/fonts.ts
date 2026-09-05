import {
  Klee_One,
  Zen_Kaku_Gothic_New,
} from 'next/font/google';

export const kleeOne = Klee_One({
  weight: ['400', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-klee-one',
});

export const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-zen-kaku',
});

export const fontClassNames = [kleeOne.variable, zenKakuGothicNew.variable].join(' ');
