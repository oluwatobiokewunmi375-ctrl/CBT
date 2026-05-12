export function createToken(user) {
  return Buffer.from(JSON.stringify(user)).toString("base64")
}

export function verifyToken(token) {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString())
  } catch {
    return null
  }
}
