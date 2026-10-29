import { LiveApiClient } from './live.js';
import { MockApiClient } from './mock.js';
import { ApiClient, ApiClientConfig, ApiMode } from './types.js';

export * from './types.js';
export * from './mock.js';
export * from './live.js';

export function createApiClient(config?: ApiClientConfig): ApiClient {
  const envMode =
    typeof process !== 'undefined' && process.env?.API_MODE
      ? (process.env.API_MODE.toLowerCase() as ApiMode)
      : 'mock';

  const mode = config?.mode || envMode || 'mock';

  if (mode === 'live') {
    return new LiveApiClient(config);
  }

  return new MockApiClient();
}

export const API_CLIENT_VERSION = '1.0.0';
export default createApiClient;
