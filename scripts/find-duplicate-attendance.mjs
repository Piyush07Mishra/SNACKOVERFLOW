import mongoose from 'mongoose';
import { format } from 'date-fns';

const uri = 'mongodb://127.0.0.1:27017/empay';
await mongoose.connect(uri, { bufferCommands: false });
const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Attendance = mongoose.model('AttendanceTemp', schema, 'attendances');
const today = format(new Date(), 'yyyy-MM-dd');

const docs = await Attendance.find({ date: today, status: { $in: ['Present', 'Half_Day'] } }).lean();
const groups = new Map();
for (const doc of docs) {
  const key = `${doc.user?.toString() || 'unknown'}|${doc.date}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(doc);
}

const duplicates = Array.from(groups.entries())
  .filter(([, items]) => items.length > 1)
  .map(([key, items]) => ({ key, items }));

console.log('today count', docs.length);
console.log('distinct users', new Set(docs.map((d) => d.user?.toString())).size);
console.log('duplicate groups', duplicates.length);
for (const { key, items } of duplicates) {
  console.log('--- duplicate group:', key);
  for (const item of items) {
    console.log({ _id: item._id.toString(), employeeId: item.employeeId, status: item.status, checkIn: item.checkIn, checkOut: item.checkOut, createdAt: item.createdAt });
  }
}

if (duplicates.length > 0) {
  console.log('Removing duplicates, keeping one per group...');
  for (const { items } of duplicates) {
    // Choose the record to keep: prefer one with checkOut, otherwise latest createdAt
    items.sort((a, b) => {
      if (!!a.checkOut !== !!b.checkOut) return !!a.checkOut ? -1 : 1;
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    const keep = items[0];
    const removeIds = items.slice(1).map((d) => d._id);
    if (removeIds.length > 0) {
      const result = await Attendance.deleteMany({ _id: { $in: removeIds } });
      console.log('Removed', result.deletedCount, 'docs for user', keep.user?.toString(), 'kept', keep._id.toString());
    }
  }
}

await mongoose.disconnect();
console.log('Done');
