export const AuthService = {
  login: (user) => {
    return {
      id: user.id,
      role: user.role,
      schoolId: user.schoolId
    }
  },

  verify: (token) => {
    return token ? true : false
  }
}
