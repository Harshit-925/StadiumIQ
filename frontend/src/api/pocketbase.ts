import PocketBase from 'pocketbase';

const POCKETBASE_URL =
  import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

/** Singleton PocketBase client instance */
export const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation for concurrent requests
pb.autoCancellation(false);
