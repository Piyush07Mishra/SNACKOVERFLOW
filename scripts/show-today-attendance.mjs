import mongoose from 'mongoose';
import { format } from 'date-fns';

const uri = 'mongodb://127.0.0.1:27017/empay';
await mongoose.connect(uri, { bufferCommands: false });
const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Attendance = mongoose.model('AttendanceTemp2', schema, 'attendances');
const today = format(new Date(), 'yyyy-MM-dd');
const docs = await Attendance.find({ date: today, status: { $in: ['Present', 'Half_Day'] } }).lean();
console.log(JSON.stringify(docs.map(d => ({ _id: d._id.toString(), user: d.user?.toString(), employeeId: d.employeeId, status: d.status, date: d.date, checkIn: d.checkIn, checkOut: d.checkOut, createdAt: d.createdAt })), null, 2));
await mongoose.disconnect();
