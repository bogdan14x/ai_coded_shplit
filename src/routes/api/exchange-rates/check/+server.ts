import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isCurrencyOutdated } from '$lib/services/outdatedCurrencyService';

export async function GET({ url, locals }: RequestEvent) {
    const currency = url.searchParams.get('currency');
    if (!currency) {
        return json({ error: 'Currency parameter is required' }, { status: 400 });
    }

    try {
        const db = locals.db;
        const outdated = await isCurrencyOutdated(db, currency);
        return json({ outdated });
    } catch (error) {
        console.error('Error checking currency outdated status:', error);
        return json({ error: 'Failed to check currency status' }, { status: 500 });
    }
}
