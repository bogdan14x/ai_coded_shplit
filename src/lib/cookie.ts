export function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

export function parseSheetCookie(cookieValue: string): Array<{ slug: string; nanoid: string }> {
  try {
    if (!cookieValue) return [];
    const parsed = JSON.parse(cookieValue);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveSheetToCookie(slug: string, nanoid: string) {
  const existing = getCookie('shibasplit_sheets');
  const sheets = parseSheetCookie(existing || '[]');
  
  // Check if sheet already exists
  const exists = sheets.some(s => s.slug === slug && s.nanoid === nanoid);
  
  if (!exists) {
    // Add new sheet at the beginning
    sheets.unshift({ slug, nanoid });
    
    // Keep only the last 10 sheets
    const limited = sheets.slice(0, 10);
    
    setCookie('shibasplit_sheets', JSON.stringify(limited), 30);
  }
}
