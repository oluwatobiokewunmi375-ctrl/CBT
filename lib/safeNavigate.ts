export function safeNavigate(router: any, path: string) {
  if (typeof window === 'undefined') return

  const pushPath = () => {
    try {
      const result = router.push(path)
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          window.location.href = path
        })
      }
    } catch (err) {
      setTimeout(() => {
        try {
          const retry = router.push(path)
          if (retry && typeof retry.catch === 'function') {
            retry.catch(() => {
              window.location.href = path
            })
          }
        } catch (e) {
          window.location.href = path
        }
      }, 0)
    }
  }

  pushPath()
}
