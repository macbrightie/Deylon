import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Deprecated endpoint to avoid duplicate triggers from old crons
  return NextResponse.json({
    success: true,
    message: 'This endpoint is deprecated. All reminders are now routed through the unified hourly-check.',
  });
}
