import * as fs from 'fs';
import * as path from 'path';

const sampleDir = path.join(__dirname, 'samples');
const nogiRaw = fs.readFileSync(path.join(sampleDir, 'nogizaka_api.json'), 'utf-8');
const nogiJsonMatch = nogiRaw.match(/res\(([\s\S]*)\)/);
if (nogiJsonMatch && nogiJsonMatch[1]) {
  const nogiData = JSON.parse(nogiJsonMatch[1]);
  console.log('Keys of sample entry:', Object.keys(nogiData.data[1]));
  
  // Let's check sample entries for 3期生, 4期生, 5期生, 6期生, 1期生
  const sample3 = nogiData.data.filter((m: any) => m.cate === '3期生');
  console.log('Sample 3期生 (first 3):', sample3.slice(0, 3));
  const sample1 = nogiData.data.filter((m: any) => m.cate === '1期生');
  console.log('Sample 1期生 (first 3):', sample1.slice(0, 3));
}
