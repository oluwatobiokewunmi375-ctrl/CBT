const listeners = [];

export function subscribe(listener) {
  listeners.push(listener);
}

export function publish(event) {
  listeners.forEach(fn => fn(event));
}
