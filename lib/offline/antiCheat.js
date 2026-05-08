import { db } from './db';

export function startAntiCheatMonitor() {

  document.addEventListener('visibilitychange', async () => {

    if (document.visibilityState === 'hidden') {

      await db.cheatLogs.add({
        type: 'TAB_SWITCH',
        time: Date.now()
      });

    }

  });

  document.addEventListener('fullscreenchange', async () => {

    if (!document.fullscreenElement) {

      await db.cheatLogs.add({
        type: 'FULLSCREEN_EXIT',
        time: Date.now()
      });

    }

  });

}
