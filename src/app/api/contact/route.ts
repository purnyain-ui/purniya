import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, orderId, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const ticketId = `PUR-${Math.floor(100000 + Math.random() * 900000)}`;
    const inquiryRecord = {
      ticketId,
      name,
      email,
      phone: phone || null,
      orderId: orderId || null,
      subject: subject || 'General Customer Support',
      message,
      receivedAt: new Date().toISOString(),
    };

    console.log('Customer inquiry registered successfully:', inquiryRecord);

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Inquiry successfully registered with Purnya Customer Support desk.',
      inquiry: inquiryRecord,
    });
  } catch (err: any) {
    console.error('Contact API error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to register inquiry.' },
      { status: 500 }
    );
  }
}
