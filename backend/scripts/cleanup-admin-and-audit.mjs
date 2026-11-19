// One-off cleanup after removing the administrator role and adding the
// unique {messageId, type} index on audit trails.
//
//   node scripts/cleanup-admin-and-audit.mjs           -> list only
//   node scripts/cleanup-admin-and-audit.mjs --apply   -> delete what was listed
//
// Deletes Counselor documents whose userType is "administrator", and for each
// crisis audit message keeps the oldest entry and deletes the rest. Then
// builds the unique index.
import 'dotenv/config';
import mongoose from 'mongoose';
import Counselor from '../src/models/counselor.model.js';
import AuditTrail from '../src/models/auditTrail.model.js';

const apply = process.argv.includes('--apply');
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not set in backend/.env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const admins = await Counselor.find({ userType: /^administrator$/i }).select('_id fullName email counselorId').lean();
console.log(`\nAdministrator accounts: ${admins.length}`);
for (const a of admins) console.log(`  _id=${a._id}  counselorId=${a.counselorId ?? '-'}  ${a.fullName ?? ''} <${a.email ?? ''}>`);

const groups = await AuditTrail.aggregate([
  { $match: { messageId: { $type: 'objectId' } } },
  { $sort: { createdAt: 1 } },
  { $group: { _id: { messageId: '$messageId', type: '$type' }, ids: { $push: '$_id' }, n: { $sum: 1 } } },
  { $match: { n: { $gt: 1 } } },
]);
const extraIds = groups.flatMap((g) => g.ids.slice(1));
console.log(`\nDuplicate audit groups: ${groups.length} (${extraIds.length} extra entries; the oldest of each is kept)`);
for (const g of groups) console.log(`  messageId=${g._id.messageId}  type=${g._id.type}  entries=${g.n}`);

if (!apply) {
  console.log('\nNothing deleted. Re-run with --apply to delete the items above and build the index.\n');
} else {
  const a = admins.length ? await Counselor.deleteMany({ _id: { $in: admins.map((x) => x._id) } }) : { deletedCount: 0 };
  const d = extraIds.length ? await AuditTrail.deleteMany({ _id: { $in: extraIds } }) : { deletedCount: 0 };
  await AuditTrail.syncIndexes();
  console.log(`\nDeleted ${a.deletedCount} administrator account(s) and ${d.deletedCount} duplicate audit entr(y/ies). Unique index built.\n`);
}

await mongoose.disconnect();
