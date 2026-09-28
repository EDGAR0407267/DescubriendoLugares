import Script from 'next/script'

/**
 * Google Analytics 4, rendered only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set
 * (never a hard-coded id). Performance: gtag.js loads with `lazyOnload`
 * (browser idle time, after the page's own resources), so it cannot affect
 * LCP or block hydration.
 *
 * Privacy: Consent Mode v2 starts with every storage type DENIED, so no
 * analytics or ad cookies are written. Before relying on full measurement,
 * add a consent banner (CMP) that calls
 *   gtag('consent', 'update', { analytics_storage: 'granted' })
 * and update the cookie policy (src/content/pages). See docs/SEO.md.
 */
export function Analytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
gtag('js',new Date());gtag('config',${JSON.stringify(measurementId)});`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="lazyOnload"
      />
    </>
  )
}
