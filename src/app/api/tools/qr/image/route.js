import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  const fg = searchParams.get('fg') || '141311';
  const bg = searchParams.get('bg') || 'F6F0E0';
  const size = parseInt(searchParams.get('size') || '400', 10);
  const margin = parseInt(searchParams.get('margin') || '2', 10);

  if (!data) {
    return new NextResponse('Missing data parameter', { status: 400 });
  }

  try {
    const decodedData = decodeURIComponent(data);
    
    // Format colors with '#' if not present
    const fgColor = fg.startsWith('#') ? fg : `#${fg}`;
    const bgColor = bg.startsWith('#') ? bg : `#${bg}`;

    // Generate QR Code as a PNG Buffer
    const qrBuffer = await QRCode.toBuffer(decodedData, {
      type: 'png',
      width: isNaN(size) ? 400 : size,
      margin: isNaN(margin) ? 2 : margin,
      color: {
        dark: fgColor, // Customized foreground color
        light: bgColor // Customized background color
      }
    });

    // Return the image buffer directly with image/png content type
    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('QR Generation Error:', error);
    return new NextResponse('Failed to generate QR code', { status: 500 });
  }
}
