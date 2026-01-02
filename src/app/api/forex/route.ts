import { NextResponse } from 'next/server';

const CURRENCY_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

export async function GET() {
  try {
    const response = await fetch(CURRENCY_API, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch currency data');
    }

    const data = await response.json();

    return NextResponse.json({
      usdInr: data.usd?.inr || null,
      date: data.date || null,
    });
  } catch (error) {
    console.error('Error fetching forex data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency data' },
      { status: 500 }
    );
  }
}
