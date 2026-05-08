import { db } from '../offline/db';

export async function addToSyncQueue(data) {
  await db.syncQueue.add(data);
}

export async function flushSyncQueue(sendToServerFn) {

  const queue = await db.syncQueue.toArray();

  for (const item of queue) {
    await sendToServerFn(item);
  }

  await db.syncQueue.clear();
}
