import { axiosAuth } from './api'


export const getInventory = async () => {
    return axiosAdmin.get("/");
}


export const registerInventory = async (data) => {
  return axiosAuth.post('/', data)
}


export const deleteInventory = async (id) => {
  return axiosAuth.delete(`/${id}`)
}
