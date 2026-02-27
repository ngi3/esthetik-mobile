// Lightweight event bus compatible with React Native (no Node 'events' polyfill)
type Handler = (...args: any[]) => void;

class StatusBus {
  private listeners: Record<string, Set<Handler>> = {};

  on(event: string, handler: Handler) {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(handler);
  }

  off(event: string, handler: Handler) {
    this.listeners[event]?.delete(handler);
    if (this.listeners[event]?.size === 0) delete this.listeners[event];
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.listeners[event];
    if (!handlers) return;
    // Clone to avoid mutation issues if handler removes itself
    [...handlers].forEach((h) => {
      try {
        h(...args);
      } catch (err) {
        // Fail-safe: ignore handler exceptions
        console.warn('[StatusBus] handler error', err);
      }
    });
  }

  setBackendDown(reason?: string) {
    this.emit('backend:down', reason);
  }

  setBackendUp() {
    this.emit('backend:up');
  }
}

const statusBus = new StatusBus();
export default statusBus;
