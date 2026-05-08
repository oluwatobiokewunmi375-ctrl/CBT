import { addToSyncQueue } from './syncEngine';

export async function saveAnswerOffline(data) {

  await addToSyncQueue({
    type: 'ANSWER',
    payload: data
  });

}
