import { axiosApi } from './api'

export const getInvoices = async (params = {}) => {
  return axiosApi.get('/invoices', { params })
}

export const getIssuedInvoices = async (params = {}) => {
  return axiosApi.get('/invoices/issued', { params })
}

export const exportInvoicePdf = async (invoiceId) => {
  return axiosApi.get(`/invoices/${invoiceId}/pdf`, {
    responseType: 'blob',
  })
}
