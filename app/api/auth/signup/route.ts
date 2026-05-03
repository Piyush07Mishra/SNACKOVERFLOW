import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';
import { getNextSerial } from '@/lib/services/counterService';
import { generateEmployeeId, deriveCompanyCode } from '@/lib/services/employeeIdService';

export async function POST(req: Request) {
  try {
    const { companyName, firstName, lastName, email, password, phone } =
      await req.json();

    const normalizedCompanyName = typeof companyName === 'string' ? companyName.trim() : '';

    // ── 1. Validate input ──────────────────────────────────────────────────
    if (!normalizedCompanyName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (normalizedCompanyName.length < 2) {
      return NextResponse.json(
        { error: 'Company name must be at least 2 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // ── 2. Check for duplicate email (global — admin email must be unique) ─
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // ── 3. Hash password ───────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── 4. Derive a unique companyCode from the company name ───────────────
    let companyCode = deriveCompanyCode(normalizedCompanyName);

    // If companyCode already exists, append a number suffix to make it unique
    let suffix = 1;
    let codeCandidate = companyCode;
    while (await Company.findOne({ companyCode: codeCandidate })) {
      codeCandidate = `${companyCode}${suffix}`;
      suffix++;
    }
    companyCode = codeCandidate;

    // ── 5. Create company ──────────────────────────────────────────────────
    const company = await Company.create({
      name: normalizedCompanyName,
      companyCode,
      email,
      phone: phone || '',
    });

    // ── 6. Generate deterministic Admin employee ID ────────────────────────
    const joiningDate = new Date();
    const year = joiningDate.getFullYear();
    const serial = await getNextSerial(company._id, year);
    const employeeId = generateEmployeeId(
      companyCode,
      firstName,
      lastName,
      year,
      serial
    );

    // ── 7. Create Admin user ───────────────────────────────────────────────
    const user = await User.create({
      companyId: company._id,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'Admin',
      employeeId,
      joiningDate,
    });

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          companyId: user.companyId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
