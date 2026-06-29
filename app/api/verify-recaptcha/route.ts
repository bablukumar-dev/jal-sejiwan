import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA token is missing' },
        { status: 400 }
      );
    }

    // Retrieve secret key with fallback from the user's registration details
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LefjjotAAAAABzkMWBNtnuH_7WY9B946jetMYnc';
    
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({
        success: false,
        error: 'reCAPTCHA verification failed',
        details: data['error-codes'] || [],
      });
    }

    // Since we're using reCAPTCHA v3, we check the score (Reject login if score < 0.5)
    const score = data.score !== undefined ? data.score : 1.0;

    if (score < 0.5) {
      return NextResponse.json({
        success: false,
        error: `reCAPTCHA verification score too low: ${score}`,
        score,
      });
    }

    return NextResponse.json({
      success: true,
      score,
    });
  } catch (error: any) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
