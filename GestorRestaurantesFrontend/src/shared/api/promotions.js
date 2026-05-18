import { axiosApi } from './api'

export const getActivePromotions = async () => {
  return axiosApi.get('/promotions/active')
}

export const getAllPromotions = async () => {
  return axiosApi.get('/promotions')
}

export const createPromotion = async (payload) => {
  return axiosApi.post('/promotions', payload)
}

export const approvePromotion = async (id) => {
  return axiosApi.put(`/promotions/approve/${id}`)
}
