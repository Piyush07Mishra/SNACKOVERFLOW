import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

/**
 * DEV-ONLY: Wipes the entire database.
 * GET /api/admin/wipe
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  await dbConnect();
  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();
  const dropped: string[] = [];

  for (const col of collections) {
    await db.dropCollection(col.name);
    dropped.push(col.name);
  }

  return NextResponse.json({
    message: 'Database wiped successfully',
    dropped,
  });
}
