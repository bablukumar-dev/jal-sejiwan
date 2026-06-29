'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function ReCaptchaProvider() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LefjjotAAAAAHJzBiP_--RekTALVeeC7v1A5t5d';

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      console.warn("reCAPTCHA site key is missing. Using fallback for development.");
    }
  }, []);

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
      strategy="afterInteractive"
    />
  );
}
