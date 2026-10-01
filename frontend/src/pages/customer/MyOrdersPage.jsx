import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { orderApi } from '../../api/orderApi';
import { toast } from 'react-toastify';
import { ShoppingBag, Eye, Calendar, DollarSign, CreditCard, Loader2, X, XCircle, Truck, AlertCircle, Package } from 'lucide-react';
import { formatVND } from '../../lib/utils';

const statusColors = {
  'Chờ thanh toán': 'bg-rose-100 text-rose-800 border border-rose-200',
  'Chờ xác nhận': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Đã xác nhận': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Bàn giao vận chuyển': 'bg-teal-100 text-teal-800 border border-teal-200',
  'Đang giao': 'bg-purple-100 text-purple-800 border border-purple-200',
  'Giao thành công': 'bg-green-100 text-green-800 border border-green-200',
  'Giao thất bại': 'bg-orange-100 text-orange-800 border border-orange-200',
  'Đã hủy': 'bg-red-100 text-red-800 border border-red-200',
};

const CANCEL_REASONS = [
  'Đổi ý không muốn mua nữa',
  'Muốn thay đổi địa chỉ nhận hàng / số điện thoại',
  'Muốn thêm/bớt sản phẩm hoặc đổi sản phẩm khác',
  'Tìm thấy giá tốt hơn ở nơi khác',
  'Thời gian giao hàng dự kiến quá lâu',
  'Lý do khác'
];

const canCancelOrder = (status) => {
  return status === 'Chờ xác nhận' || status === 'Đã xác nhận' || status === 'Chờ thanh toán';
};

function CancelOrderModal({ order, onClose }) {
  const queryClient = useQueryClient();
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      return await orderApi.cancel(id, reason);
    },
    onSuccess: () => {
      toast.success('Hủy đơn hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      if (order?.mahoadon) {
        queryClient.invalidateQueries({ queryKey: ['customer-order-detail', order.mahoadon] });
      }
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.';
      toast.error(msg);
    }
  });

  if (!order) return null;

  const handleConfirmCancel = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Lý do khác'
      ? (customReason.trim() || 'Lý do khác')
      : (customReason.trim() ? `${selectedReason}: ${customReason.trim()}` : selectedReason);

    cancelMutation.mutate({
      id: order.mahoadon,
      reason: finalReason
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand-light pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <XCircle className="w-5 h-5" />
            <h3 className="text-lg font-bold text-brand-dark">Hủy đơn hàng: <span className="text-rose-600">{order.mahoadon}</span></h3>
          </div>
          <button onClick={onClose} disabled={cancelMutation.isPending} className="text-gray-400 hover:text-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertCircle size={14} className="text-rose-600 shrink-0" />
            Bạn có chắc chắn muốn hủy đơn hàng này?
          </p>
          <p className="text-rose-700 pl-5">
            Sau khi hủy, số lượng hàng sẽ được hoàn trả lại kho và bạn không thể hoàn tác thao tác này.
          </p>
        </div>

        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Vui lòng chọn lý do hủy đơn:
            </label>
            <div className="space-y-1.5">
              {CANCEL_REASONS.map((r, i) => (
                <label key={i} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer p-2.5 rounded-xl hover:bg-brand-bg transition border border-brand-light/60 has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/10">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-brand-primary"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {selectedReason === 'Lý do khác' ? 'Chi tiết lý do hủy (bắt buộc):' : 'Ghi chú thêm (tùy chọn):'}
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={selectedReason === 'Lý do khác' ? 'Vui lòng nhập lý do hủy chi tiết...' : 'Ghi chú thêm nếu có...'}
              rows={3}
              required={selectedReason === 'Lý do khác'}
              className="w-full text-xs p-3 border border-brand-light rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-light">
            <button
              type="button"
              onClick={onClose}
              disabled={cancelMutation.isPending}
              className="px-4 py-2.5 rounded-xl border border-brand-light text-gray-600 text-xs font-bold hover:bg-brand-light transition"
            >
              Giữ lại đơn hàng
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Đang xử lý hủy...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Xác nhận hủy đơn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerOrderDetailModal({ orderId, onClose, onCancelOrder }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ['customer-order-detail', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await orderApi.getById(orderId);
      return res.data;
    }
  });

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand-light pb-4">
          <h3 className="text-xl font-bold font-heading text-brand-dark">Đơn hàng: {orderId}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
          </div>
        ) : !order ? (
          <p className="text-center text-gray-400 py-8">Không thể tải thông tin chi tiết đơn hàng.</p>
        ) : (
          <div className="space-y-6">
            {order.trangthaidh === 'Bàn giao vận chuyển' && (
              <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <Truck size={16} className="text-teal-600 shrink-0" />
                <span>Đơn hàng đã được bàn giao cho đơn vị vận chuyển nên không thể hủy. Vui lòng liên hệ bộ phận hỗ trợ nếu cần trợ giúp.</span>
              </div>
            )}

            {order.trangthaidh === 'Đã hủy' && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-start gap-2">
                <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Đơn hàng này đã bị hủy.</span>
                  {order.lydohuy && <p className="mt-0.5 text-red-700">Lý do hủy: {order.lydohuy}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs bg-brand-bg/50 p-4 rounded-xl">
              <div><span className="text-gray-500">Ngày đặt:</span> <strong className="text-brand-dark">{new Date(order.ngaytaohoadon).toLocaleString('vi-VN')}</strong></div>
              <div><span className="text-gray-500">Tổng tiền thanh toán:</span> <strong className="text-brand-accent font-bold">{formatVND(order.tongtientt)}</strong></div>
              <div><span className="text-gray-500">Thanh toán:</span> <strong className="text-brand-dark">{order.trangthaitt}</strong></div>
              <div><span className="text-gray-500">Trạng thái giao nhận:</span> <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.trangthaidh] || 'bg-gray-100 text-gray-700'}`}>{order.trangthaidh}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Phương thức:</span> <strong className="text-brand-dark">{order.pthucthanhtoan}</strong></div>
              {order.diachichitiet && <div className="col-span-2"><span className="text-gray-500">Địa chỉ giao:</span> <span className="text-gray-700">{order.diachichitiet}</span></div>}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Chi tiết mặt hàng ({order.items?.length || 0})</h4>
              <div className="border border-brand-light rounded-xl overflow-hidden text-xs shadow-xs">
                <table className="w-full text-left">
                  <thead className="bg-brand-light/50 border-b border-brand-light font-bold text-gray-600 uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-center">Số lượng</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light">
                    {order.items?.map((item, idx) => {
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
                                  className="w-14 h-14 object-cover rounded-xl border border-brand-light shadow-xs shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-brand-light text-base">📦</div>';
                                  }}
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-brand-light/50 flex items-center justify-center text-gray-400 border border-brand-light shrink-0">
                                  <Package size={22} />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-brand-dark text-xs sm:text-sm">{item.tenSanpham || item.masanpham}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {item.masanpham}
                                  </span>
                                  {item.donViTinh && (
                                    <span className="text-[11px] text-gray-500">ĐVT: {item.donViTinh}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">{formatVND(itemPrice)}</td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-0.5 bg-brand-light/60 text-brand-dark font-bold rounded-lg text-xs">
                              {itemQty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-brand-accent whitespace-nowrap">{formatVND(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Price Breakdown */}
              <div className="bg-brand-bg/30 rounded-xl p-4 border border-brand-light space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tiền hàng (tổng giá sản phẩm):</span>
                  <span className="font-semibold text-brand-dark">
                    {formatVND(parseFloat(order.tongtiensp || order.tongtientt || 0))}
                  </span>
                </div>
                {parseFloat(order.phivanchuyen || 0) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-semibold text-brand-dark">
                      {formatVND(parseFloat(order.phivanchuyen))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-brand-light text-sm">
                  <span className="font-bold text-brand-dark">Tổng tiền thanh toán:</span>
                  <span className="font-bold text-brand-accent text-base">
                    {formatVND(parseFloat(order.tongtientt || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-brand-light pt-4">
              {canCancelOrder(order.trangthaidh) ? (
                <button
                  type="button"
                  onClick={() => onCancelOrder(order)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 hover:border-rose-300 transition text-xs"
                >
                  <XCircle size={16} /> Hủy đơn hàng
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={onClose}
                className="bg-brand-primary text-brand-dark font-bold px-6 py-2.5 rounded-xl hover:bg-brand-primary/90 transition text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await customerApi.getOrders('me');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <h1 className="text-2xl font-bold font-heading text-brand-dark flex items-center gap-2">
          <ShoppingBag className="text-brand-primary" />
          Đơn hàng của tôi
        </h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-3xl border border-brand-light">
            <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
            <p className="text-sm text-gray-500 font-medium">Đang tải lịch sử mua hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-brand-light p-16 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto text-4xl">
              📦
            </div>
            <h2 className="text-xl font-bold text-brand-dark font-heading">Bạn chưa có đơn đặt hàng nào</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Khi bạn mua sản phẩm đặc sản tại cửa hàng, danh sách đơn hàng sẽ xuất hiện tại đây để bạn tiện theo dõi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const cancellable = canCancelOrder(order.trangthaidh);
              const isHandedOver = order.trangthaidh === 'Bàn giao vận chuyển';
              const isCancelled = order.trangthaidh === 'Đã hủy';

              return (
                <div key={order.mahoadon} className="bg-white rounded-2xl border border-brand-light p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-primary/40 transition duration-300">
                  
                  {/* Meta details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-dark text-base">{order.mahoadon}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColors[order.trangthaidh] || 'bg-gray-100 text-gray-700'}`}>
                        {order.trangthaidh}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(order.ngaytaohoadon || order.ngaymua || order.ngayMua || Date.now()).toLocaleDateString('vi-VN')}</div>
                      <div className="flex items-center gap-1.5"><CreditCard size={14} /> {order.pthucthanhtoan || order.pthucThanhToan || 'COD'}</div>
                      <div className="flex items-center gap-1.5"><DollarSign size={14} /> {order.trangthaitt || order.trangThaiTT || 'Chưa thanh toán'}</div>
                    </div>

                    {isCancelled && order.lydohuy && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl font-medium inline-block mt-1">
                        Lý do hủy: {order.lydohuy}
                      </div>
                    )}
                  </div>

                  {/* Amount and actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-brand-light">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400">Tổng thanh toán</div>
                      <div className="text-lg font-black text-brand-accent font-heading">{formatVND(order.tongtientt)}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {cancellable && (
                        <button
                          type="button"
                          onClick={() => setCancellingOrder(order)}
                          className="flex items-center gap-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 px-3 py-2 rounded-xl text-xs font-bold transition"
                          title="Hủy đơn hàng này"
                        >
                          <XCircle size={14} /> Hủy đơn
                        </button>
                      )}

                      {isHandedOver && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1.5 rounded-xl" title="Đơn hàng đã bàn giao cho bên vận chuyển nên không thể hủy">
                          <Truck size={13} /> Đã bàn giao
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.mahoadon)}
                        className="flex items-center gap-1.5 border border-brand-light text-brand-dark px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary hover:border-brand-primary transition"
                      >
                        <Eye size={14} /> Xem chi tiết
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      <CustomerOrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onCancelOrder={(order) => {
          setCancellingOrder(order);
        }}
      />

      <CancelOrderModal
        order={cancellingOrder}
        onClose={() => setCancellingOrder(null)}
      />
    </div>
  );
}
