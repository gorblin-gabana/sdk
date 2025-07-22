// Mock stream module for browser compatibility

export class Stream {
  on() { return this; }
  emit() { return false; }
  pipe() { return this; }
}

const stream = { Stream };
export default stream;