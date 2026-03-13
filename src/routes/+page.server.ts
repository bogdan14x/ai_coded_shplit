import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { sheets } from '$lib/db/schema';
import { generateSheetId, validateNanoid } from '$lib/nanoid';

export const load: PageServerLoad = async ({ cookies }) => {
  const sheetCookie = cookies.get('shibasplit_sheets');
  let recentSheets: Array<{ slug: string; nanoid: string }> = [];
  
  if (sheetCookie) {
    try {
      const parsed = JSON.parse(sheetCookie);
      if (Array.isArray(parsed)) {
        recentSheets = parsed.slice(0, 3);
      }
    } catch {
      // Invalid cookie, ignore
    }
  }
  
  return {
    recentSheets,
  };
};

const MIN_SHEET_NAME_LENGTH = 3;
const MAX_SHEET_NAME_LENGTH = 300;

const INVALID_CHARS_PATTERN = /[!@#$%^&*()+=\[\]{};':"\\|,.<>\/?~`]+/u;

const VALID_CHAR_PATTERN = /[\w\-_\s\p{Emoji}]/u;

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const rawSheetName = formData.get('sheetName') as string;

    if (typeof rawSheetName !== 'string') {
      return {
        error: 'Sheet name must be a valid string',
      };
    }

    const sheetName = rawSheetName.trim();

    if (sheetName.length < MIN_SHEET_NAME_LENGTH) {
      return {
        error: `Sheet name must be at least ${MIN_SHEET_NAME_LENGTH} characters long`,
      };
    }

    if (sheetName.length > MAX_SHEET_NAME_LENGTH) {
      return {
        error: `Sheet name must be no more than ${MAX_SHEET_NAME_LENGTH} characters long`,
      };
    }

    if (INVALID_CHARS_PATTERN.test(sheetName)) {
      return {
        error: 'Sheet name can only contain letters, numbers, dashes (-), underscores (_), and emojis',
      };
    }

    if (!VALID_CHAR_PATTERN.test(sheetName)) {
      return {
        error: 'Sheet name must contain at least one valid character',
      };
    }

    const slug = sheetName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug || slug.length < MIN_SHEET_NAME_LENGTH) {
      return {
        error: 'Sheet name must contain at least some valid characters after processing',
      };
    }

    const fullId = generateSheetId(slug);
    const nanoid = fullId.split('-').slice(-1)[0];

    if (!validateNanoid(nanoid)) {
      return {
        error: 'Failed to generate valid sheet ID. Please try again.',
      };
    }

    await db.insert(sheets).values({
      slug,
      nanoid,
      name: sheetName,
      description: null,
      currency: 'USD',
    }).run();

    // Save to cookie for future visits
    const existing = cookies.get('shibasplit_sheets');
    let sheetsList: Array<{ slug: string; nanoid: string }> = [];
    
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          sheetsList = parsed;
        }
      } catch {
        // Invalid cookie, start fresh
      }
    }
    
    // Add new sheet at the beginning
    sheetsList.unshift({ slug, nanoid });
    
    // Keep only the last 10 sheets
    sheetsList = sheetsList.slice(0, 10);
    
    // Set cookie for 30 days
    cookies.set('shibasplit_sheets', JSON.stringify(sheetsList), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax'
    });

    redirect(303, `/sheets/${slug}/${nanoid}`);
  },
};
