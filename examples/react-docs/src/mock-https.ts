// Mock https module for browser compatibility

export function request() {
  return {
    on: () => {},
    write: () => {},
    end: () => {},
  };
}

const https = { request };
export default https;