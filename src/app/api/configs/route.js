import { NextResponse } from 'next/server';
import { deleteConfig } from '@/lib/db';

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing configuration ID' }, { status: 400 });
  }

  try {
    await deleteConfig(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete configuration: ' + error.message }, { status: 500 });
  }
}
