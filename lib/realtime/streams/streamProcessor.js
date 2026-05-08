import { publish } from '../bus/eventBus';

export function processRealtimeEvent(event) {
  const enriched = {
    ...event,
    processedAt: Date.now()
  };

  publish(enriched);

  return enriched;
}
