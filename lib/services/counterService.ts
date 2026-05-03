import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Counter } from '@/lib/models/Counter';

/**
 * Atomically increments and returns the next serial number for a given
 * company + year combination. Uses findOneAndUpdate with $inc + upsert
 * to ensure thread-safety and no duplicate serials.
 */
export async function getNextSerial(
  companyId: mongoose.Types.ObjectId | string,
  year: number
): Promise<number> {
  await dbConnect();

  const result = await Counter.findOneAndUpdate(
    { companyId, year },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: 'after', new: true }
  );

  return result!.sequence;
}
