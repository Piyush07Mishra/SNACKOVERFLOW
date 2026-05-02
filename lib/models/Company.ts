import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  logoUrl: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '', maxlength: 300 },
  industry: { type: String, default: '' },
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'], default: '1-10' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
