import { axiosApi } from './api'

export const getActivePromotions = async (params = {}) => {
  return axiosApi.get('/promotions/active', { params })
}

export const createPromotion = async (payload) => {
  return axiosApi.post('/promotions', payload)
}

export const approvePromotion = async (id) => {
  return axiosApi.put(`/promotions/approve/${id}`)
}
