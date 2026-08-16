import {
  Klee_One,
  Gowun_Batang,
  Gowun_Dodum,
  Zen_Maru_Gothic,
  Zen_Kaku_Gothic_New,
  Fraunces,
} from 'next/font/google';

export const kleeOne = Klee_One({
  weight: ['400', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-klee-one',
});

export const gowunBatang = Gowun_Batang({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-gowun-batang',
});

export const gowunDodum = Gowun_Dodum({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-gowun-dodum',
});

export const zenMaruGothic = Zen_Maru_Gothic({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-zen-maru',
});

export const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-zen-kaku',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const fontClassNames = [
  kleeOne.variable,
  gowunBatang.variable,
  gowunDodum.variable,
  zenMaruGothic.variable,
  zenKakuGothicNew.variable,
  fraunces.variable,
].join(' ');
