import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/empay';
await mongoose.connect(uri, { bufferCommands: false });
const schema = new mongoose.Schema({}, { strict: false });
const Attendance = mongoose.model('AttendanceTempRemove', schema, 'attendances');

const id = '69f698fa4fc0acd6a265383f';
const result = await Attendance.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
console.log('Deleted count:', result.deletedCount);
await mongoose.disconnect();
