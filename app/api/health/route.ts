import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    project: 'Wild Hills Real Estate',
    timestamp: new Date().toISOString(),
  });
}
