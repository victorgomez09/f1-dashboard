import { Evolutions } from "@/models/chart";

const BASE_URL = 'https://studious-dollop-vg7x6gjv9rpfwpjq-8000.app.github.dev/timming';

export async function getMap(year: number = new Date().getFullYear(), location: string, session_type: string) {
  const response = await fetch(
    `${BASE_URL}/${year}/${location}/${session_type}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json() as any,
  };
}
