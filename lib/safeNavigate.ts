export function safeNavigate(router: any, path: string) {
  if (typeof window === 'undefined') return
  try {
    // attempt immediate push
    router.push(path)
  } catch (err) {
    // defer as a fallback to avoid "Router action dispatched before initialization"
    setTimeout(() => {
      try { router.push(path) } catch (e) { window.location.href = path }
    }, 0)
  }
}
