import api from './axios';

export const orderApi = {
  getAll: (params) => api.get('/orders/', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders/', data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel: (id, reason = 'Khách hàng yêu cầu hủy đơn') => {
    const payload = typeof reason === 'object' ? reason : { lyDoHuy: reason };
    return api.post(`/orders/${id}/cancel`, payload);
  },
  getInvoice: (id) => api.get(`/orders/${id}/invoice`),
};
