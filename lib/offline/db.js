import Dexie from 'dexie';

export const db = new Dexie('CBT_OFFLINE_DB');

db.version(1).stores({
  exams: 'id,title',
  questions: 'id,examId',
  answers: 'id,questionId,examId',
  syncQueue: '++id,type',
  cheatLogs: '++id,type,time'
});
