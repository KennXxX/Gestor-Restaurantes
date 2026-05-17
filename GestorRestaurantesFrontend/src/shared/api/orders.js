import { axiosApi } from './api'

export const getOrders = async (params = {}) => {
  return axiosApi.get('/orders', { params })
}

export const getOrdersByRestaurant = async (restaurantId) => {
  return axiosApi.get(`/orders/restaurant/${restaurantId}`)
}

export const createOrder = async (payload) => {
  return axiosApi.post('/orders', payload)
}

export const updateOrderStatus = async (id, status) => {
  return axiosApi.put(`/orders/status/${id}`, { status })
}
