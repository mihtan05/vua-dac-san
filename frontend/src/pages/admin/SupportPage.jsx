import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  Search, MessageCircle, CheckCircle, Clock, Loader2, X, ChevronRight,
  Package, User, Phone, Calendar, ShoppingBag
} from 'lucide-react';
import { formatVND } from '../../lib/utils';

const MOCK_TICKETS = [
  { mayeucau: 'YC001', tieude: 'Sản phẩm bị vỡ khi nhận hàng', noidung: 'Tôi nhận được gói bánh pía bị nứt vỡ, cần đổi hàng mới.', trangthai: 'Chờ xử lý', loaiyeucau: 'Khiếu nại', ngaytao: '2026-06-27T09:00:00Z', khachhang: 'customer1@gmail.com', mahoadon: 'HD20260001' },
  { mayeucau: 'YC002', tieude: 'Hỏi về chính sách đổi trả hàng', noidung: 'Tôi muốn biết thời gian đổi trả sản phẩm là bao lâu?', trangthai: 'Đã phản hồi', loaiyeucau: 'Hỏi đáp', ngaytao: '2026-06-26T14:00:00Z', khachhang: 'customer2@gmail.com', mahoadon: null },
  { mayeucau: 'YC003', tieude: 'Giao hàng chậm hơn dự kiến', noidung: 'Đơn hàng HD20260003 đã 5 ngày nhưng chưa nhận được.', trangthai: 'Đang xử lý', loaiyeucau: 'Khiếu nại', ngaytao: '2026-06-26T10:30:00Z', khachhang: 'customer3@gmail.com', mahoadon: 'HD20260003' },
];

const statusStyle = {
  'Chờ xử lý': 'bg-yellow-100 text-yellow-800',
  'Đang xử lý': 'bg-blue-100 text-blue-800',
  'Đã phản hồi': 'bg-green-100 text-green-800',
  'Đã đóng': 'bg-gray-100 text-gray-600',
};

function TicketModal({ ticket, onClose }) {
  const [reply, setReply] = useState('');
  const queryClient = useQueryClient();

  // 1. Fetch order details if ticket is linked to an order
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['ticket-order-detail', ticket?.mahoadon],
    enabled: !!ticket?.mahoadon,
    queryFn: async () => {
      try {
        const res = await api.get(`/orders/${ticket.mahoadon}`);
        return res.data;
      } catch {
        return null;
      }
    }
  });

  // 2. Fetch customer details if not already loaded with order
  const { data: customer } = useQuery({
    queryKey: ['ticket-customer-detail', ticket?.makhachhang],
    enabled: !!ticket?.makhachhang && !order?.tenkhachhang,
    queryFn: async () => {
      try {
        const res = await api.get(`/orders/customers/${ticket.makhachhang}`);
        return res.data;
      } catch {
        return null;
      }
    }
  });

  // 3. Fetch product detail if linked without order
  const { data: product } = useQuery({
    queryKey: ['ticket-product-detail', ticket?.masanpham],
    enabled: !!ticket?.masanpham && !ticket?.mahoadon,
    queryFn: async () => {
      try {
        const res = await api.get(`/products/${ticket.masanpham}`);
        return res.data;
      } catch {
        return null;
      }
    }
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/content/support-requests/${ticket.mayeucau}/reply`, { noiDungPhanHoi: reply });
    },
    onSuccess: () => {
      toast.success('Đã gửi phản hồi thành công!');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi phản hồi');
    }
  });

  if (!ticket) return null;

  const customerName = order?.tenkhachhang || customer?.hoten;
  const customerPhone = order?.sdtkhachhang || customer?.sdt;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-brand-bg/40">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold font-heading text-brand-dark">
              Chi tiết Yêu cầu <span className="text-brand-primary">#{ticket.mayeucau}</span>
            </h3>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusStyle[ticket.trangthai] || 'bg-gray-100 text-gray-700'}`}>
              {ticket.trangthai}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Top Meta: Request Type & Customer Info */}
          <div className="bg-brand-bg/40 border border-brand-light rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-brand-light">
              <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-brand-light text-brand-accent">
                {ticket.loaiyeucau}
              </span>
              <span className="text-xs text-gray-500">
                Thời gian gửi: {new Date(ticket.ngaytao).toLocaleString('vi-VN')}
              </span>
            </div>

            {/* Customer Info (Tên khách gửi khiếu nại) */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <User size={15} className="text-brand-primary shrink-0" />
                <span className="text-gray-500">Khách gửi:</span>
                <strong className="text-brand-dark font-bold text-sm">
                  {customerName ? customerName : ticket.makhachhang}
                </strong>
                <span className="bg-white border border-brand-light text-gray-500 px-1.5 py-0.5 rounded text-[11px]">
                  Mã KH: {ticket.makhachhang}
                </span>
                {customerPhone && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 ml-2">
                    <Phone size={13} className="text-gray-400" />
                    {customerPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer message */}
          <div className="bg-white border border-brand-light rounded-xl p-4 space-y-1.5 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-[11px]">
              Nội dung khách gửi:
            </span>
            <p className="text-brand-dark text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {ticket.noidungkh}
            </p>
          </div>

          {/* Linked Order & Products details */}
          {ticket.mahoadon && (
            <div className="border border-brand-light rounded-xl p-4 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs pb-2.5 border-b border-brand-light">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-brand-primary" />
                  <span className="font-bold text-brand-dark text-sm">
                    Đơn hàng liên quan: #{ticket.mahoadon}
                  </span>
                  {order?.trangthaidh && (
                    <span className="text-[11px] bg-brand-light/70 text-brand-dark font-semibold px-2 py-0.5 rounded-full">
                      {order.trangthaidh}
                    </span>
                  )}
                </div>
                {order?.tongtientt && (
                  <span className="font-bold text-brand-accent text-sm">
                    Tổng đơn: {formatVND(parseFloat(order.tongtientt))}
                  </span>
                )}
              </div>

              {isLoadingOrder ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-400">
                  <Loader2 className="animate-spin text-brand-primary h-4 w-4" />
                  Đang tải thông tin chi tiết đơn hàng...
                </div>
              ) : order && order.items && order.items.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Sản phẩm trong đơn hàng ({order.items.length}):
                  </p>

                  <div className="border border-brand-light rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-brand-light/50 border-b border-brand-light font-bold text-gray-600 uppercase text-[11px]">
                        <tr>
                          <th className="px-3.5 py-2.5">Sản phẩm</th>
                          <th className="px-3.5 py-2.5 text-right">Đơn giá</th>
                          <th className="px-3.5 py-2.5 text-center">Số lượng</th>
                          <th className="px-3.5 py-2.5 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-light">
                        {order.items.map((item, idx) => {
                          const isLinkedProd = ticket.masanpham && (item.masanpham === ticket.masanpham);
                          const itemPrice = parseFloat(item.giaban || item.dongia || 0);
                          const itemQty = item.soluong || 1;
                          const lineTotal = itemQty * itemPrice;

                          return (
                            <tr 
                              key={idx} 
                              className={`transition ${isLinkedProd ? 'bg-amber-50/70' : 'hover:bg-brand-bg/30'}`}
                            >
                              <td className="px-3.5 py-3">
                                <div className="flex items-center gap-3">
                                  {item.hinhAnh ? (
                                    <img
                                      src={item.hinhAnh}
                                      alt={item.tenSanpham}
                                      className="w-12 h-12 rounded-lg object-cover border border-brand-light shadow-xs shrink-0"
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
                                  <div className="min-w-0">
                                    <p className="font-bold text-brand-dark text-xs sm:text-sm">
                                      {item.tenSanpham || `Sản phẩm ${item.masanpham}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {item.masanpham}
                                      </span>
                                      {item.donViTinh && (
                                        <span className="text-[11px] text-gray-500">ĐVT: {item.donViTinh}</span>
                                      )}
                                      {isLinkedProd && (
                                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                          Sản phẩm khiếu nại
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3.5 py-3 text-right text-gray-700 whitespace-nowrap">
                                {formatVND(itemPrice)}
                              </td>
                              <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                <span className="inline-block px-2.5 py-0.5 bg-brand-light/60 text-brand-dark font-bold rounded-lg text-xs">
                                  {itemQty}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 text-right font-bold text-brand-accent whitespace-nowrap">
                                {formatVND(lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Không có thông tin chi tiết các mặt hàng của đơn này.</p>
              )}
            </div>
          )}

          {/* Linked Product (when no order, but product specified) */}
          {!ticket.mahoadon && ticket.masanpham && product && (
            <div className="border border-brand-light rounded-xl p-3.5 bg-white space-y-2 shadow-xs">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                Sản phẩm liên quan:
              </span>
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-brand-bg/40 border border-brand-light">
                <div className="flex items-center gap-3">
                  {product.hinhanh ? (
                    <img src={product.hinhanh} alt={product.tensanpham} className="w-12 h-12 rounded-lg object-cover border border-brand-light shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm shrink-0">📦</div>
                  )}
                  <div>
                    <p className="font-bold text-brand-dark text-xs sm:text-sm">{product.tensanpham}</p>
                    <span className="text-[11px] text-gray-400">{product.masanpham}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-brand-accent text-xs">{formatVND(product.giadon)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Past Response (if any) */}
          {ticket.noidungphanhoi && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-green-900">
                <CheckCircle size={15} className="text-green-600" />
                Đã phản hồi trước đó:
              </span>
              <p className="text-green-900 text-sm pl-5 leading-relaxed whitespace-pre-wrap">
                {ticket.noidungphanhoi}
              </p>
            </div>
          )}

          {/* Reply input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
              {ticket.noidungphanhoi ? 'Gửi phản hồi bổ sung cho khách hàng' : 'Phản hồi của CSKH'}
            </label>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={3}
              placeholder="Nhập nội dung phản hồi cho khách hàng..."
              className="w-full border border-brand-light rounded-xl p-3.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-light bg-brand-bg/20 flex gap-3 justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 border border-brand-light text-gray-600 font-semibold rounded-xl hover:bg-white transition text-xs"
          >
            Hủy
          </button>
          <button
            onClick={() => replyMutation.mutate()}
            disabled={!reply.trim() || replyMutation.isPending}
            className="px-6 py-2.5 bg-brand-primary text-brand-dark font-bold rounded-xl hover:bg-brand-primary/90 transition text-xs shadow-sm disabled:opacity-50"
          >
            {replyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/support-requests');
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
      } catch {
        return MOCK_TICKETS;
      }
    }
  });

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers-list-for-support'],
    queryFn: async () => {
      try {
        const res = await api.get('/orders/customers?limit=100');
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
      } catch {
        return [];
      }
    }
  });

  const customerMap = {};
  customersData.forEach(c => {
    if (c.makhachhang) {
      customerMap[c.makhachhang] = c.hoten;
    }
  });

  const filtered = tickets.filter(t => {
    const custName = customerMap[t.makhachhang] || '';
    return !search ||
      t.noidungkh?.toLowerCase().includes(search.toLowerCase()) ||
      t.makhachhang?.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase()) ||
      t.mahoadon?.toLowerCase().includes(search.toLowerCase());
  });

  const pending = tickets.filter(t => t.trangthai === 'Chờ xử lý').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark font-heading">Chăm sóc Khách hàng</h1>
        <p className="text-sm text-gray-500">Xử lý yêu cầu hỗ trợ, khiếu nại và hỏi đáp từ khách hàng</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng yêu cầu', value: tickets.length, color: 'text-brand-dark', bg: 'bg-white' },
          { label: 'Chờ xử lý', value: pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Đang xử lý', value: tickets.filter(t => t.trangthai === 'Đang xử lý').length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Đã phản hồi', value: tickets.filter(t => t.trangthai === 'Đã phản hồi').length, color: 'text-green-700', bg: 'bg-green-50' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border border-brand-light rounded-2xl p-5 shadow-sm`}>
            <div className={`text-2xl font-bold font-heading ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm tiêu đề, email khách hàng..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div
              key={t.mayeucau}
              onClick={() => setSelectedTicket(t)}
              className="bg-white border border-brand-light rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex-shrink-0 flex items-center justify-center text-brand-primary mt-0.5">
                    <MessageCircle size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusStyle[t.trangthai] || ''}`}>{t.trangthai}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-light text-brand-accent">{t.loaiyeucau}</span>
                    </div>
                    <p className="text-sm text-brand-dark mt-2 font-medium line-clamp-1">{t.noidungkh}</p>
                    {t.noidungphanhoi && (
                      <p className="text-xs text-green-700 mt-1 line-clamp-1 italic border-l-2 border-green-400 pl-2">
                        Admin: {t.noidungphanhoi}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Khách hàng: <strong className="text-gray-700 font-semibold">{customerMap[t.makhachhang] ? `${customerMap[t.makhachhang]} (${t.makhachhang})` : t.makhachhang}</strong></span>
                      <span>·</span>
                      <span>{new Date(t.ngaytao).toLocaleString('vi-VN')}</span>
                      {t.mahoadon && <><span>·</span><span className="text-brand-accent font-semibold">Đơn: {t.mahoadon}</span></>}
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p>Không có yêu cầu nào phù hợp</p>
            </div>
          )}
        </div>
      )}

      <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
