import { Evolutions } from "@/models/chart";

const BASE_URL = 'https://studious-dollop-vg7x6gjv9rpfwpjq-8000.app.github.dev/drivers';

interface DriverData {
    x: number | string;
    y: number;
    eventName: string;
}

export async function getDriverStanding(year: number = new Date().getFullYear()) {
  const response = await fetch(
    `${BASE_URL}/standings-evolution/${year}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json() as Evolutions,
  };
}

export async function getDriverRanking(year: number = new Date().getFullYear()) {
  const response = await fetch(
    `${BASE_URL}/ranking-evolution/${year}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json(),
  };
}

export async function getDriverStats(year: number = new Date().getFullYear()) {
  const response = await fetch(
    `${BASE_URL}/driver-stats/${year}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json() as any,
  };
}

export async function getPointsDristribution(year: number = new Date().getFullYear()) {
  const response = await fetch(
    `${BASE_URL}/points-distribution/${year}`
  );
  if (!response.ok) throw new Error('Failed to fetch data');
  return {
    data: await response.json() as any,
  };
}