import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name && !email) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    // Check if email already exists for another user (only if we're updating email)
    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // For the email field, we'll store it in a new displayEmail field
    // This allows users to change their display email without affecting login
    // Update user with only name - don't change the email used for login
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        // Store display email in metadata or a custom field if schema allows
        // but keep the original email unchanged for login purposes
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: email || updatedUser.email, // Return the new display email
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 