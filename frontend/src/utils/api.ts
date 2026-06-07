export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 60000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeout}ms. The server might be experiencing a cold start.`,
        { cause: error }
      );
    }
    throw error;
  }
}
