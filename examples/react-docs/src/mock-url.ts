// Mock url module for browser compatibility
// Use browser's native URL implementation

export class URL extends globalThis.URL {}
export function parse(url: string) {
  try {
    const parsed = new globalThis.URL(url);
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    };
  } catch {
    return {};
  }
}

const url = { URL, parse };
export default url;