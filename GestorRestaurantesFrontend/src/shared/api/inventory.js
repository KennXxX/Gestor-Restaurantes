import { axiosApi } from './api'

export const getInventories = async () => {
  return axiosApi.get('/inventory')
}

export const createInventory = async (payload) => {
  return axiosApi.post('/inventory', payload)
}

export const updateInventory = async (id, payload) => {
  return axiosApi.put(`/inventory/${id}`, payload)
}

export const deleteInventory = async (id) => {
  return axiosApi.delete(`/inventory/${id}`)
}

export const getInventory = async () => {
  return getInventories()
}

export const registerInventory = async (data) => {
  return createInventory(data)
}
