export function getFocusState() {
  const isVisible = document.visibilityState === 'visible'
  const hasFocus = document.hasFocus()

  return {
    visible: isVisible,
    focused: hasFocus,
    timestamp: Date.now()
  }
}
