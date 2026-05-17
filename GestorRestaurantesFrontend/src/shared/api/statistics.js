import { axiosApi } from './api'

export const getAdminStatistics = async () => {
  return axiosApi.get('/statistics/admin/overview')
}
