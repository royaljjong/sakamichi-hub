import * as fs from 'fs';
import * as path from 'path';

const sampleDir = path.join(__dirname, 'samples');

console.log('=== Nogizaka API Sample ===');
const nogiApiRaw = fs.readFileSync(path.join(sampleDir, 'nogizaka_api.json'), 'utf-8');
// Sometimes it starts with "res(" or is pure JSON or JSONP
console.log('Nogi API prefix:', nogiApiRaw.slice(0, 200));

console.log('\n=== Sakura Profile Sample ===');
const sakuraHtml = fs.readFileSync(path.join(sampleDir, 'sakurazaka_profile_sample.html'), 'utf-8');
// look for blog link or sns links
const sakuraLinks = sakuraHtml.match(/href="([^"]+)"/g) || [];
console.log('Sakura profile links:', sakuraLinks.filter(l => l.includes('blog') || l.includes('twitter') || l.includes('instagram') || l.includes('x.com') || l.includes('diary')));

console.log('\n=== Hinata Profile Sample ===');
const hinataHtml = fs.readFileSync(path.join(sampleDir, 'hinatazaka_profile_sample.html'), 'utf-8');
const hinataLinks = hinataHtml.match(/href="([^"]+)"/g) || [];
console.log('Hinata profile links:', hinataLinks.filter(l => l.includes('diary') || l.includes('twitter') || l.includes('instagram') || l.includes('x.com')));
