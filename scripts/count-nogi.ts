import * as fs from 'fs';
import * as path from 'path';

const sampleDir = path.join(__dirname, 'samples');
const nogiRaw = fs.readFileSync(path.join(sampleDir, 'nogizaka_api.json'), 'utf-8');
const nogiJsonMatch = nogiRaw.match(/res\(([\s\S]*)\)/);
if (nogiJsonMatch && nogiJsonMatch[1]) {
  const nogiData = JSON.parse(nogiJsonMatch[1]);
  const activeMembers = nogiData.data.filter((m: any) => m.cate && m.cate !== '卒業生' && m.code !== '10001');
  console.log('Nogi active member count:', activeMembers.length);
  const byCate: Record<string, number> = {};
  for (const m of activeMembers) {
    byCate[m.cate] = (byCate[m.cate] || 0) + 1;
  }
  console.log('Nogi active members by generation:', byCate);

  const grads = nogiData.data.filter((m: any) => m.cate === '卒業生' || m.code.length < 5);
  console.log('Nogi grad count in official API:', grads.length);
}
