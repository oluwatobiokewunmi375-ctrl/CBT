const errors = []

export function reportError(error, context = {}) {
  const err = {
    message: error.message || error,
    stack: error.stack || null,
    context,
    timestamp: Date.now()
  }

  errors.push(err)
  return err
}

export function getErrors() {
  return errors
}
