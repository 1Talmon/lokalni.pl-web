// Tab routes in swipe order — consumed by MainLayout's CSS scroll-snap strip
export const SWIPE_TABS = ['/', '/chat', '/calendar', '/favorites'] as const;
// View names used by native iOS tab bar plugin — must match SWIPE_TABS order
export const SWIPE_TAB_NAMES = ['home', 'chat', 'calendar', 'favorites'] as const;
