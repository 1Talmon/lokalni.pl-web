window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

var consent = localStorage.getItem('cookie-consent');
if (consent === 'accepted') {
    gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        wait_for_update: 500
    });
} else {
    gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500
    });
}
