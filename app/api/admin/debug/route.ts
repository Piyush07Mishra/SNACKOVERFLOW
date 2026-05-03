import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';
import mongoose from 'mongoose';

/**
 * DEV-ONLY debug endpoint.
 * GET /api/admin/debug
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  await dbConnect();

  // Use raw collection to bypass schema validation
  const db = mongoose.connection.db!;
  const rawUsers = await db.collection('users').find({}).toArray();
  const rawCompanies = await db.collection('companies').find({}).toArray();

  const userSummary = rawUsers.map((u) => ({
    _id: u._id.toString(),
    email: u.email,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    companyId: u.companyId ? u.companyId.toString() : null,
    employeeId: u.employeeId ?? null,
    hasCompanyId: !!u.companyId,
  }));

  const companySummary = rawCompanies.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    companyCode: c.companyCode ?? null,
  }));

  return NextResponse.json({
    userCount: rawUsers.length,
    companyCount: rawCompanies.length,
    users: userSummary,
    companies: companySummary,
  });
}
