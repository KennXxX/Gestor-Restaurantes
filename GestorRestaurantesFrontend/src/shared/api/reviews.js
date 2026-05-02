import { axiosApi } from './api'

export const getReviews = async () => {
  return axiosApi.get('/reviews')
}

export const getReviewsByRestaurant = async (restaurantId) => {
  return axiosApi.get(`/reviews/restaurant/${restaurantId}`)
}

export const getReviewsByMenu = async (menuId) => {
  return axiosApi.get(`/reviews/menu/${menuId}`)
}

export const deleteReview = async (id) => {
  return axiosApi.delete(`/reviews/${id}`)
}
