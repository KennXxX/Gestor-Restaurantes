import { axiosAuth } from './api'

export const updateUserProfile = async (userData) => {
  return axiosAuth.put('/users/profile', userData)
}

export const changePassword = async (passwordData) => {
  return axiosAuth.post('/users/change-password', passwordData)
}

export const deleteAccount = async () => {
  return axiosAuth.delete('/users/account')
}
