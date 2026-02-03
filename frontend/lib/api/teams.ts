const BASE_URL = 'https://studious-dollop-vg7x6gjv9rpfwpjq-8000.app.github.dev/teams'; 

export async function getTeamsMapping(year: number = new Date().getFullYear()) {
  const response = await fetch(
    `${BASE_URL}/mapping/${year}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json(),
  };
}