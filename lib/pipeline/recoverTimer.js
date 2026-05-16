export function recoverTimer(examId) {

  const key = `cbt_timer_${examId}`;
  const saved = localStorage.getItem(key);

  if (!saved) return null;

  return JSON.parse(saved);

}
