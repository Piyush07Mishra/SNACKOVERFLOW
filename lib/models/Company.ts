import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  // Unique short code used in employee ID generation (e.g., "OI" for "Odoo Inc")
  companyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 6,
  },
  logoUrl: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    default: '',
    match: [/^\+?[0-9]{7,15}$/, 'Please fill a valid phone number'],
  },
  address: {
    type: String,
    maxlength: 300,
    default: '',
  },
  industry: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export const Company =
  mongoose.models.Company || mongoose.model('Company', CompanySchema);
