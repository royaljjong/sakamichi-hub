import * as fs from 'fs';
import * as path from 'path';
import { Dataset, checkIntegrity } from '../src/lib/schema';
import { PortalDataset } from '../src/lib/portal-schema';

function validate() {
  const dataDir = path.join(__dirname, '..', 'data');
  const groupsPath = path.join(dataDir, 'groups.json');
  const membersPath = path.join(dataDir, 'members.json');
  const portalPath = path.join(dataDir, 'portal.json');

  if (!fs.existsSync(groupsPath)) {
    console.error('❌ Error: data/groups.json does not exist');
    process.exit(1);
  }

  const groupsFile = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));
  const membersFile = fs.existsSync(membersPath)
    ? JSON.parse(fs.readFileSync(membersPath, 'utf-8'))
    : [];

  const rawDataset = {
    schemaVersion: groupsFile.schemaVersion || '1.0.0',
    generatedAt: groupsFile.generatedAt || new Date().toISOString().slice(0, 10),
    groups: groupsFile.groups || [],
    members: Array.isArray(membersFile) ? membersFile : (membersFile.members || []),
  };

  console.log('🔍 Validating schema with Zod...');
  const parseResult = Dataset.safeParse(rawDataset);

  if (!parseResult.success) {
    console.error('❌ Schema Validation Failed:');
    console.error(JSON.stringify(parseResult.error.format(), null, 2));
    process.exit(1);
  }

  console.log('✅ Zod schema validation passed.');
  console.log('🔍 Checking relational integrity...');
  const integrityErrors = checkIntegrity(parseResult.data);

  if (integrityErrors.length > 0) {
    console.error(`❌ Integrity Check Failed with ${integrityErrors.length} errors:`);
    integrityErrors.forEach((err, idx) => {
      console.error(`  ${idx + 1}. ${err}`);
    });
    process.exit(1);
  }

  console.log('✅ Relational integrity check passed.');
  console.log('🔍 Validating portal events, venues, and rankings...');
  const portalFile = JSON.parse(fs.readFileSync(portalPath, 'utf-8'));
  const portalResult = PortalDataset.safeParse(portalFile);
  if (!portalResult.success) {
    console.error('❌ Portal Schema Validation Failed:');
    console.error(JSON.stringify(portalResult.error.format(), null, 2));
    process.exit(1);
  }
  console.log(`✅ Portal schema passed: ${portalResult.data.events.length} events, ${portalResult.data.venues.length} venues, ${portalResult.data.rankings.length} ranking facts.`);
  console.log(`📊 Summary: ${parseResult.data.groups.length} groups, ${parseResult.data.members.length} members.`);
  const auditPath = path.join(dataDir, 'audit-report.json');
  if (fs.existsSync(auditPath)) {
    const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    if (audit?.stats?.total !== parseResult.data.members.length) {
      console.warn(`⚠️ Audit report is stale: ${audit?.stats?.total ?? 0}/${parseResult.data.members.length} members covered.`);
    }
  }
}

validate();
