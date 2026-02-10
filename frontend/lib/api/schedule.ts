const BASE_URL = 'https://studious-dollop-vg7x6gjv9rpfwpjq-8000.app.github.dev/schedule';

export async function getSchedule(year: number = new Date().getFullYear()) {
  const response = await fetch(
    `${BASE_URL}/${year}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json() as any,
  };
}
