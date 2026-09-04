import * as fs from 'fs';
import * as path from 'path';
import { Dataset } from '../src/lib/schema';
import { PortalDataset } from '../src/lib/portal-schema';
import { Discography } from '../src/lib/discography-schema';

const dataDir = path.join(__dirname, '..', 'data');
const groupsFile = JSON.parse(fs.readFileSync(path.join(dataDir, 'groups.json'), 'utf8'));
const membersFile = JSON.parse(fs.readFileSync(path.join(dataDir, 'members.json'), 'utf8'));
const portal = PortalDataset.parse(JSON.parse(fs.readFileSync(path.join(dataDir, 'portal.json'), 'utf8')));
const discography = Discography.parse(JSON.parse(fs.readFileSync(path.join(dataDir, 'discography.json'), 'utf8')));
const dataset = Dataset.parse({ schemaVersion: groupsFile.schemaVersion ?? '1.0.0', generatedAt: groupsFile.generatedAt, groups: groupsFile.groups, members: Array.isArray(membersFile) ? membersFile : membersFile.members });

const groups = dataset.groups.map((group) => {
  const members = dataset.members.filter((member) => member.memberships.some((ms) => ms.groupId === group.id));
  const active = members.filter((member) => member.status === 'active' || member.status === 'graduating');
  const count = (predicate: (member: typeof members[number]) => boolean) => members.filter(predicate).length;
  return {
    groupId: group.id,
    status: group.status,
    members: members.length,
    activeMembers: active.length,
    withImage: count((member) => Boolean(member.imageUrl)),
    withOfficialProfile: count((member) => member.links.some((link) => link.type === 'official_profile' && link.isOfficial)),
    withRenderableLink: count((member) => member.links.some((link) => link.isOfficial && (link.status === 'ok' || link.status === 'redirected'))),
    memberCheckedAtOldest: members.map((member) => member.provenance.checkedAt).sort()[0] ?? null,
    events: portal.events.filter((event) => event.groupIds.includes(group.id)).length,
    discography: discography.singles.filter((single) => single.groupId === group.id).length,
    hasLogo: Boolean(group.logoUrl),
  };
});

const report = { generatedAt: new Date().toISOString(), sourceDates: { groups: dataset.generatedAt, portal: portal.generatedAt, discography: discography.generatedAt }, totals: { groups: dataset.groups.length, members: dataset.members.length, events: portal.events.length, discography: discography.singles.length }, groups };
fs.writeFileSync(path.join(dataDir, 'coverage-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.table(groups);
console.log('Coverage report saved to data/coverage-report.json');
