import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';
import { generateEmployeeId, deriveCompanyCode } from '@/lib/services/employeeIdService';
import { getNextSerial } from '@/lib/services/counterService';

/**
 * DEV-ONLY migration endpoint.
 * Backfills companyId, firstName, lastName, employeeId for existing users.
 * Safe to call multiple times (idempotent).
 *
 * Usage: GET /api/admin/migrate
 */
export async function GET() {
  // Safety guard — only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  await dbConnect();

  const results: string[] = [];

  try {
    // 1. Find all users with no companyId (legacy records — catches both missing and null)
    const orphanUsers = await User.find({
      $or: [{ companyId: { $exists: false } }, { companyId: null }],
    });
    results.push(`Found ${orphanUsers.length} users without companyId`);

    if (orphanUsers.length === 0) {
      return NextResponse.json({ message: 'Nothing to migrate', results });
    }

    // 2. Find or create a default company for these users
    let company = await Company.findOne({});
    if (!company) {
      const companyCode = deriveCompanyCode('Default Company');
      company = await Company.create({
        name: 'Default Company',
        companyCode,
        email: orphanUsers[0]?.email ?? 'admin@default.com',
      });
      results.push(`Created default company with code: ${company.companyCode}`);
    } else {
      // Ensure companyCode exists
      if (!company.companyCode) {
        company.companyCode = deriveCompanyCode(company.name);
        await company.save();
        results.push(`Backfilled companyCode: ${company.companyCode}`);
      } else {
        results.push(`Using existing company: ${company.name} (${company.companyCode})`);
      }
    }

    // 3. Backfill each user
    for (const user of orphanUsers) {
      const updates: any = { companyId: company._id };

      // Split legacy name into firstName/lastName
      if (!user.firstName) {
        const parts = (user.name || '').trim().split(/\s+/);
        updates.firstName = parts[0] || 'Unknown';
        updates.lastName = parts.slice(1).join(' ') || 'User';
      }

      // Generate employeeId if missing
      if (!user.employeeId) {
        const joiningDate = user.joiningDate ?? user.createdAt ?? new Date();
        const year = new Date(joiningDate).getFullYear();
        const serial = await getNextSerial(company._id, year);
        updates.employeeId = generateEmployeeId(
          company.companyCode,
          updates.firstName ?? user.firstName,
          updates.lastName ?? user.lastName,
          year,
          serial
        );
      }

      await User.findByIdAndUpdate(user._id, updates);
      results.push(`✓ Migrated user: ${user.email} → ${updates.employeeId ?? user.employeeId}`);
    }

    // 4. Backfill companies with no companyCode
    const companiesWithoutCode = await Company.find({ companyCode: { $exists: false } });
    for (const c of companiesWithoutCode) {
      let code = deriveCompanyCode(c.name);
      // Make unique
      let suffix = 1;
      let candidate = code;
      while (await Company.findOne({ companyCode: candidate, _id: { $ne: c._id } })) {
        candidate = `${code}${suffix++}`;
      }
      await Company.findByIdAndUpdate(c._id, { companyCode: candidate });
      results.push(`✓ Backfilled companyCode for ${c.name}: ${candidate}`);
    }

    // 5. Sync User indexes so legacy global unique indexes are dropped
    const droppedIndexes = await User.syncIndexes();
    if (droppedIndexes.length > 0) {
      results.push(`Dropped legacy User indexes: ${droppedIndexes.join(', ')}`);
    } else {
      results.push('User indexes already matched the schema');
    }

    return NextResponse.json({
      message: 'Migration complete',
      results,
    });
  } catch (err: any) {
    console.error('Migration error:', err);
    return NextResponse.json(
      { error: err.message, results },
      { status: 500 }
    );
  }
}
