import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const user = await User.findById(session.user.id).select('bankDetails');
    return NextResponse.json(user?.bankDetails || {});
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bankName, accountNumber, ifscCode, branchName } = await req.json();

    await dbConnect();
    console.log('Updating bank details for user:', session.user.id);
    console.log('Data:', { bankName, accountNumber, ifscCode, branchName });

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          bankDetails: {
            bankName,
            accountNumber,
            ifscCode,
            branchName,
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.error('User not found during bank details update');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Successfully updated bank details');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bank details update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
