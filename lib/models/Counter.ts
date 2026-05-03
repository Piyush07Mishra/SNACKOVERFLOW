import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  sequence: {
    type: Number,
    default: 0,
  },
});

// Unique per company per year — ensures atomic increments work correctly
CounterSchema.index({ companyId: 1, year: 1 }, { unique: true });

export const Counter =
  mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
