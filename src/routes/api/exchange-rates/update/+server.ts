import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { updateOutdatedRatesInBackground } from '$lib/services/outdatedCurrencyService';

export async function POST({ request, locals }: RequestEvent) {
    try {
        const db = locals.db;
        // Wait for the update to complete to ensure rates are fresh before proceeding
        await updateOutdatedRatesInBackground(db);
        console.log('Exchange rates update completed');

        return json({ success: true, message: 'Rates updated successfully' });
    } catch (error) {
        console.error('Error updating exchange rates:', error);
        return json({ error: 'Failed to update exchange rates' }, { status: 500 });
    }
}
