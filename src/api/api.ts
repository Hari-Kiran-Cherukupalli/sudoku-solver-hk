import axios from 'axios';
import { Grid } from '../types';
import { API_BASE_URL } from '../config';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

export async function processImage(base64Image: string): Promise<Grid> {
  const { data } = await client.post<{ grid: Grid }>('/api/process-image', {
    image: base64Image,
  });
  return data.grid;
}

export async function fetchSampleGrid(): Promise<Grid> {
  const { data } = await client.get<{ grid: Grid }>('/api/sample-grid');
  return data.grid;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await client.get('/api/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
