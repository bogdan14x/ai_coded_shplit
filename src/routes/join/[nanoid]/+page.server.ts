import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sheets, participants } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { nanoid } = params;
  const db = locals.db;

  const sheet = await db.select().from(sheets).where(
    eq(sheets.nanoid, nanoid)
  ).get();

  if (!sheet) {
    error(404, 'Sheet not found');
  }

  return {
    sheet,
  };
};

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    const { nanoid } = params;
    const formData = await request.formData();
    const db = locals.db;

    const displayName = formData.get('displayName') as string;

    if (!displayName || displayName.trim().length < 2) {
      return { error: 'Display name must be at least 2 characters' };
    }

    const name = displayName.trim();

    const sheet = await db.select().from(sheets).where(
      eq(sheets.nanoid, nanoid)
    ).get();

    if (!sheet) {
      return { error: 'Sheet not found' };
    }

    await db.insert(participants).values({
      sheetId: sheet.id,
      name,
      isCreator: false,
    }).run();

    redirect(303, `/sheets/${sheet.slug}/${sheet.nanoid}`);
  }
};