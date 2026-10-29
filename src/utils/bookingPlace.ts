// Where a booked service takes place, as the API reports it from the offer (remote / at the provider's / at the client's).
export type ServiceMode = 'remote' | 'onsite' | 'mobile';

/**
 * Place line on booking cards. The booking's address wins; without one the offer's mode decides —
 * an on-site offer whose provider listed only a city has no address, and that is not "online".
 * Returns null when the API didn't send the mode (nothing shown rather than a wrong label).
 */
export const bookingPlace = (b: { address?: string | null; serviceMode?: ServiceMode | null; serviceCity?: string | null }): { remote: boolean; label: string } | null => {
    if (b.address?.trim()) return { remote: false, label: b.address };
    switch (b.serviceMode) {
        case 'remote': return { remote: true, label: 'Zdalnie / Online' };
        case 'onsite': return { remote: false, label: b.serviceCity ? `Stacjonarnie · ${b.serviceCity}` : 'Stacjonarnie' };
        case 'mobile': return { remote: false, label: 'Dojazd do klienta' };
        default: return null;
    }
};
