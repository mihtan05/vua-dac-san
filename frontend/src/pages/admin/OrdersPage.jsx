import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  Search, Filter, Eye, CheckCircle, XCircle, Truck, Loader2, ChevronDown,
  Package, X, User, Phone, MapPin, Calendar, CreditCard
} from 'lucide-react';

const STATUS_LIST = ['Tất cả', 'Chờ thanh toán', 'Chờ xác nhận', 'Đã xác nhận', 'Bàn giao vận chuyển', 'Đang giao', 'Giao thành công', 'Giao thất bại', 'Đã hủy'];

const statusColor = {
  'Chờ thanh toán': 'bg-rose-100 text-rose-800 border border-rose-200',
  'Chờ xác nhận': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Đã xác nhận':   'bg-blue-100 text-blue-800 border border-blue-200',
  'Bàn giao vận chuyển': 'bg-teal-100 text-teal-800 border border-teal-200',
  'Đang giao': 'bg-purple-100 text-purple-800 border border-purple-200',
  'Giao thành công':   'bg-green-100 text-green-800 border border-green-200',
  'Giao thất bại':       'bg-orange-100 text-orange-800 border border-orange-200',
  'Đã hủy':       'bg-red-100 text-red-800 border border-red-200',
};

const formatVND = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

function OrderDetailModal({ order, onClose }) {
  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['admin-order-detail', order?.mahoadon],
    enabled: !!order?.mahoadon,
    queryFn: async () => {
      const res = await api.get(`/orders/${order.mahoadon}`);
      return res.data;
    }
  });

  if (!order) return null;

  const currentOrder = detail || order;
  const items = detail?.items || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-brand-bg/40">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold font-heading text-brand-dark">
              Đơn hàng: <span className="text-brand-primary">{order.mahoadon}</span>
            </h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[currentOrder.trangthaidh] || 'bg-gray-100 text-gray-700'}`}>
              {currentOrder.trangthaidh}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
              <p className="text-xs text-gray-400">Đang tải thông tin chi tiết đơn hàng...</p>
            </div>
          ) : isError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-center text-xs">
              Không thể tải thông tin chi tiết đơn hàng từ máy chủ.
            </div>
          ) : (
            <>
              {/* Order Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-bg/40 p-4 rounded-xl border border-brand-light text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 font-semibold">
                    <User size={14} className="text-brand-primary shrink-0" />
                    <span>Khách hàng:</span>
                    <strong className="text-brand-dark font-bold">
                      {currentOrder.tenkhachhang ? `${currentOrder.tenkhachhang} (${currentOrder.makhachhang})` : currentOrder.makhachhang}
                    </strong>
                  </div>
                  {currentOrder.sdtkhachhang && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="text-brand-primary shrink-0" />
                      <span>Số điện thoại:</span>
                      <strong className="text-brand-dark">{currentOrder.sdtkhachhang}</strong>
                    </div>
                  )}
                  {currentOrder.diachichitiet && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin size={14} className="text-brand-primary shrink-0 mt-0.5" />
                      <span>Địa chỉ:</span>
                      <span className="text-brand-dark">{currentOrder.diachichitiet}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-brand-primary shrink-0" />
                    <span>Thời gian đặt:</span>
                    <strong className="text-brand-dark">
                      {currentOrder.ngaytaohoadon ? new Date(currentOrder.ngaytaohoadon).toLocaleString('vi-VN') : '—'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard size={14} className="text-brand-primary shrink-0" />
                    <span>Thanh toán:</span>
                    <span className="font-semibold text-brand-dark">{currentOrder.pthucthanhtoan || 'COD'}</span>
                    <span className="text-gray-400">({currentOrder.trangthaitt || 'Chưa thanh toán'})</span>
                  </div>
                  {currentOrder.lydohuy && (
                    <div className="text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      <span className="font-bold">Lý do hủy: </span>
                      {currentOrder.lydohuy}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-brand-dark uppercase tracking-wider text-xs">
                    Danh sách sản phẩm ({items.length})
                  </h4>
                </div>

                {items.length === 0 ? (
                  <p className="text-gray-400 text-xs italic py-4 text-center">Không có thông tin chi tiết sản phẩm.</p>
                ) : (
                  <div className="border border-brand-light rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-brand-light/50 border-b border-brand-light text-gray-600 font-bold uppercase">
                        <tr>
                          <th className="px-4 py-3">Sản phẩm</th>
                          <th className="px-4 py-3 text-right">Đơn giá</th>
                          <th className="px-4 py-3 text-center">Số lượng</th>
                          <th className="px-4 py-3 text-right">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-light">
                        {items.map((item, idx) => {
                          const itemPrice = parseFloat(item.giaban || item.dongia || 0);
                          const itemQty = item.soluong || 1;
                          const lineTotal = itemQty * itemPrice;

                          return (
                            <tr key={idx} className="hover:bg-brand-bg/30 transition">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {item.hinhAnh ? (
                                    <img
                                      src={item.hinhAnh}
                                      alt={item.tenSanpham || item.masanpham}
                                      className="w-12 h-12 object-cover rounded-lg border border-brand-light shadow-xs shrink-0"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-brand-light text-sm">📦</div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-brand-light shrink-0">
                                      <Package size={20} />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-brand-dark text-xs sm:text-sm">
                                      {item.tenSanpham || `Sản phẩm ${item.masanpham}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {item.masanpham}
                                      </span>
                                      {item.donViTinh && (
                                        <span className="text-[11px] text-gray-500">
                                          ĐVT: {item.donViTinh}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">
                                {formatVND(itemPrice)}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className="inline-block px-2.5 py-1 bg-brand-light/60 text-brand-dark font-bold rounded-lg text-xs">
                                  {itemQty}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-brand-dark whitespace-nowrap">
                                {formatVND(lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-brand-bg/30 rounded-xl p-4 border border-brand-light space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tiền hàng (tổng giá sản phẩm):</span>
                  <span className="font-semibold text-brand-dark">
                    {formatVND(parseFloat(currentOrder.tongtiensp || currentOrder.tongtientt || 0))}
                  </span>
                </div>
                {parseFloat(currentOrder.phivanchuyen || 0) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-semibold text-brand-dark">
                      {formatVND(parseFloat(currentOrder.phivanchuyen))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-brand-light text-sm">
                  <span className="font-bold text-brand-dark">Tổng tiền thanh toán:</span>
                  <span className="font-bold text-brand-accent text-lg">
                    {formatVND(parseFloat(currentOrder.tongtientt || 0))}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-brand-light bg-brand-bg/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-brand-primary text-brand-dark font-bold rounded-xl hover:bg-brand-primary/90 transition text-sm shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('limit', '100');
        if (statusFilter !== 'Tất cả') {
          queryParams.set('trangThaiDH', statusFilter);
        }
        const res = await api.get(`/orders/?${queryParams.toString()}`);
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data || raw?.hoadon || []);
      } catch (err) {
        console.error('Could not fetch orders', err);
        return [];
      }
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      await api.patch(`/orders/${id}/status`, { trangThaiMoi: newStatus });
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => toast.error('Lỗi cập nhật trạng thái đơn hàng')
  });

  const cancelOrder = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/orders/${id}/cancel`, { data: { lyDoHuy: 'Hủy bởi Quản lý/Admin' } });
    },
    onSuccess: () => {
      toast.success('Hủy đơn hàng thành công và đã hoàn lại tồn kho!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => toast.error('Lỗi hủy đơn hàng')
  });

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.mahoadon?.toLowerCase().includes(search.toLowerCase()) ||
      o.makhachhang?.toLowerCase().includes(search.toLowerCase()) ||
      o.tenkhachhang?.toLowerCase().includes(search.toLowerCase()) ||
      o.sdtkhachhang?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' || o.trangthaidh === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark font-heading">Quản lý Đơn hàng</h1>
        <p className="text-sm text-gray-500">Theo dõi và xử lý tất cả đơn đặt hàng của khách</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, email khách hàng..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_LIST.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                statusFilter === s
                  ? 'bg-brand-primary text-brand-dark shadow-sm'
                  : 'bg-white text-gray-500 border border-brand-light hover:border-brand-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-light/50 border-b border-brand-light">
                <tr className="text-xs uppercase text-gray-400 font-bold">
                  <th className="px-6 py-4">Mã đơn hàng</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Thời gian đặt</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Không có đơn hàng nào phù hợp</td></tr>
                )}
                {filtered.map(o => (
                  <tr key={o.mahoadon} className="hover:bg-brand-bg/50 transition">
                    <td className="px-6 py-4 font-bold text-brand-dark">{o.mahoadon}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-dark">{o.tenkhachhang || o.makhachhang}</div>
                      {o.sdtkhachhang && <div className="text-xs text-gray-400">{o.sdtkhachhang}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(o.ngaytaohoadon).toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 text-right font-bold text-brand-dark">{formatVND(parseFloat(o.tongtientt))}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${statusColor[o.trangthaidh] || 'bg-gray-100 text-gray-600'}`}>
                        {o.trangthaidh}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          title="Xem chi tiết"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                        ><Eye size={16}/></button>
                        
                        {(o.trangthaidh === 'Chờ xác nhận' || o.trangthaidh === 'Chờ thanh toán') && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Đã xác nhận' })}
                              title="Xác nhận đơn"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                            ><CheckCircle size={16}/></button>
                            <button
                              onClick={() => cancelOrder.mutate(o.mahoadon)}
                              title="Hủy đơn"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}

                        {o.trangthaidh === 'Đã xác nhận' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Bàn giao vận chuyển' })}
                              title="Bàn giao vận chuyển"
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition"
                            ><Truck size={16}/></button>
                            <button
                              onClick={() => cancelOrder.mutate(o.mahoadon)}
                              title="Hủy đơn"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}

                        {o.trangthaidh === 'Bàn giao vận chuyển' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Đang giao' })}
                            title="Bắt đầu giao"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                          ><Truck size={16}/></button>
                        )}

                        {o.trangthaidh === 'Đang giao' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Giao thành công' })}
                              title="Giao thành công"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                            ><CheckCircle size={16}/></button>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Giao thất bại' })}
                              title="Giao thất bại"
                              className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}

                        {o.trangthaidh === 'Giao thất bại' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Đang giao' })}
                              title="Giao lại"
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                            ><Truck size={16}/></button>
                            <button
                              onClick={() => cancelOrder.mutate(o.mahoadon)}
                              title="Hủy đơn"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
