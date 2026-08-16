import * as fs from 'fs';
import * as path from 'path';

const sampleDir = path.join(__dirname, 'samples');
const hinataHtml = fs.readFileSync(path.join(sampleDir, 'hinatazaka46.html'), 'utf-8');

// Find all unique data-member in hinatazaka
const matches = Array.from(hinataHtml.matchAll(/data-member="([^"]+)"/g));
const memberIds = Array.from(new Set(matches.map(m => m[1])));
console.log('Hinata unique member codes count:', memberIds.length);
console.log('Hinata unique member codes:', memberIds);

// Look at the sections in hinatazaka HTML
const sectionMatches = hinataHtml.match(/<div class="p-member__group">([\s\S]*?)<\/div>/g) || 
                       hinataHtml.match(/<section[^>]*>([\s\S]*?)<\/section>/g) ||
                       hinataHtml.match(/<ul class="p-member__list">([\s\S]*?)<\/ul>/g);
console.log('Hinata list container matches:', sectionMatches?.length);
