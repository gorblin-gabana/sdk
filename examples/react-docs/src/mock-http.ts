// Mock http module for browser compatibility

export function request() {
  return {
    on: () => {},
    write: () => {},
    end: () => {},
  };
}

const http = { request };
export default http;