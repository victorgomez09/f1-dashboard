const BASE_URL = 'https://studious-dollop-vg7x6gjv9rpfwpjq-8000.app.github.dev/timming';

export async function getMap(year: number = new Date().getFullYear(), location: string) {
  const response = await fetch(
    `${BASE_URL}/track/${year}/${location}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json() as any,
  };
}
