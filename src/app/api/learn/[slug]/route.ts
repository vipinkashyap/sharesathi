import { NextRequest, NextResponse } from 'next/server';

const GROKIPEDIA_API = 'https://grokipedia-api.com/page';

interface GrokipediaResponse {
  title: string;
  slug: string;
  url: string;
  content_text: string;
  char_count: number;
  word_count: number;
  references_count: number;
  references: { number: number; url: string }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const response = await fetch(`${GROKIPEDIA_API}/${encodeURIComponent(slug)}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
      throw new Error(`Grokipedia API error: ${response.status}`);
    }

    const data: GrokipediaResponse = await response.json();

    return NextResponse.json({
      title: data.title,
      slug: data.slug,
      content: data.content_text,
      wordCount: data.word_count,
      referencesCount: data.references_count,
      references: data.references?.slice(0, 5) || [],
    });
  } catch (error) {
    console.error('Error fetching from Grokipedia:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
