import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { updateOutdatedRatesInBackground } from '$lib/services/outdatedCurrencyService';

export async function POST({ request }: RequestEvent) {
    try {
        // Trigger background update of all outdated currencies
        // This runs asynchronously without blocking the response
        updateOutdatedRatesInBackground()
            .then(() => console.log('Background exchange rate update completed'))
            .catch(err => console.error('Background exchange rate update failed:', err));

        return json({ success: true, message: 'Background update initiated' });
    } catch (error) {
        console.error('Error initiating background update:', error);
        return json({ error: 'Failed to initiate background update' }, { status: 500 });
    }
}
