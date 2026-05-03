import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { User } from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = subscriptionSchema.parse(body);

    await dbConnect();

    // Update user's push subscription
    await User.findByIdAndUpdate(
      session.user.id,
      { 
        pushSubscription: validatedData,
        lastActiveAt: new Date()
      },
      { new: true, upsert: false }
    );

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription saved successfully'
    });

  } catch (error) {
    console.error('Push subscription error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid subscription data',
          errors: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Remove user's push subscription
    await User.findByIdAndUpdate(
      session.user.id,
      { $unset: { pushSubscription: 1 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription removed successfully'
    });

  } catch (error) {
    console.error('Push unsubscription error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
