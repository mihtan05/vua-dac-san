import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { contentApi } from '../../api/contentApi';
import { productApi } from '../../api/productApi';
import { MessageSquare, CheckCircle, Send, Loader2, HelpCircle, Package, ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatVND } from '../../lib/utils';

export default function SupportPage() {
  const navigate = useNavigate();
  const [loaiYeuCau, setLoaiYeuCau] = useState('Tư vấn');
  const [maSanpham, setMaSanpham] = useState('');
  const [maHoaDon, setMaHoaDon] = useState('');
  const [noiDungKH, setNoiDungKH] = useState('');

  // Fetch logged-in customer profile to check authentication
  const { data: customer, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['my-profile'],
    retry: false,
    queryFn: async () => {
      const res = await customerApi.getMe();
      return res.data;
    }
  });

  // Fetch customer's orders history to let them link support requests to an order
  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    enabled: !!customer,
    queryFn: async () => {
      const res = await customerApi.getOrders('me');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // Fetch products list to link support requests to a specific product
  const { data: productsData } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const res = await productApi.getAll({ limit: 100 });
      return res.data?.data || [];
    }
  });
  const products = productsData || [];

  // Fetch customer's support requests
  const { data: myRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ['my-support-requests'],
    enabled: !!customer,
    queryFn: async () => {
      const res = await contentApi.getMySupportRequests();
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // Mutation to submit support request
  const submitRequest = useMutation({
    mutationFn: (payload) => contentApi.createSupportRequest(payload),
    onSuccess: () => {
      toast.success('Gửi yêu cầu hỗ trợ thành công! Nhân viên chăm sóc khách hàng sẽ liên hệ lại sớm nhất.');
      setNoiDungKH('');
      setMaHoaDon('');
      setMaSanpham('');
      refetchRequests();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gửi yêu cầu thất bại');
    }
  });

  const selectedOrder = orders.find(o => o.mahoadon === maHoaDon);
  const selectedOrderItems = selectedOrder?.danhsachsp || selectedOrder?.danhSachSP || selectedOrder?.items || [];

  const getOrderOptionLabel = (order) => {
    const rawItems = order.danhsachsp || order.danhSachSP || order.items || [];
    let prodNames = order.tenCacSanpham;

    if (!prodNames && rawItems.length > 0) {
      prodNames = rawItems.map(item => {
        const prod = products.find(p => p.masanpham === (item.maSanpham || item.masanpham));
        const name = item.tenSanpham || prod?.tensanpham || `SP #${item.maSanpham || item.masanpham}`;
        const qty = item.soLuong || item.soluong || 1;
        return `${name} (x${qty})`;
      }).join(', ');
    }

    const rawDate = order.ngaytaohoadon || order.ngaymua || order.ngayMua;
    let dateStr = '';
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('vi-VN');
      }
    }

    const priceStr = formatVND(order.tongtientt || 0);

    if (prodNames) {
      return `${prodNames} — Đơn #${order.mahoadon} (${priceStr}${dateStr ? ` · ${dateStr}` : ''})`;
    }
    return `Đơn hàng #${order.mahoadon} (${priceStr}${dateStr ? ` · ${dateStr}` : ''})`;
  };

  const handleOrderChange = (selectedId) => {
    setMaHoaDon(selectedId);
    if (!selectedId) {
      setMaSanpham('');
      return;
    }
    const found = orders.find(o => o.mahoadon === selectedId);
    const items = found?.danhsachsp || found?.danhSachSP || found?.items || [];
    if (items.length === 1) {
      setMaSanpham(items[0].maSanpham || items[0].masanpham);
    } else {
      setMaSanpham('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer) {
      toast.error('Vui lòng đăng nhập tài khoản Khách hàng trước khi gửi yêu cầu hỗ trợ');
      return;
    }
    if (!noiDungKH.trim()) {
      toast.error('Vui lòng điền nội dung yêu cầu hỗ trợ');
      return;
    }

    submitRequest.mutate({
      loaiYeuCau,
      maKhachHang: customer.makhachhang,
      maSanpham: maSanpham || null,
      maHoaDon: maHoaDon || null,
      noiDungKH: noiDungKH.trim()
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
        <p className="text-sm text-gray-500 font-medium">Đang kiểm tra thông tin tài khoản...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-brand-bg px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-brand-light shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-brand-dark font-heading">Yêu cầu đăng nhập</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn cần đăng nhập tài khoản **Khách hàng** để gửi yêu cầu hỗ trợ kỹ thuật, đóng góp ý kiến hoặc khiếu nại chất lượng đơn hàng.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition text-sm shadow-sm"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        
        {/* Banner header */}
        <div className="bg-gradient-to-br from-brand-secondary to-[#224A37] text-white rounded-3xl p-8 sm:p-10 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 text-9xl">💬</div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">Gửi yêu cầu CSKH & Khiếu nại</h1>
          <p className="text-gray-200 text-xs sm:text-sm max-w-lg">
            Đội ngũ chăm sóc khách hàng của Vua Đặc Sản luôn sẵn sàng lắng nghe mọi góp ý, thắc mắc hay khiếu nại của quý khách để cải thiện dịch vụ.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-brand-light p-6 sm:p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Request Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Loại yêu cầu</label>
              <div className="grid grid-cols-3 gap-3">
                {['Tư vấn', 'Thắc mắc', 'Khiếu nại'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLoaiYeuCau(type)}
                    className={`py-3 rounded-xl text-xs font-bold transition border ${
                      loaiYeuCau === type
                        ? 'bg-brand-primary border-brand-primary text-brand-dark shadow-sm'
                        : 'border-brand-light bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Order Linkage */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                Liên kết Đơn hàng (Không bắt buộc)
              </label>
              <select
                value={maHoaDon}
                onChange={e => handleOrderChange(e.target.value)}
                className="w-full bg-brand-bg text-brand-dark text-sm px-4 py-3 rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary transition"
              >
                <option value="">-- Không liên kết đơn hàng --</option>
                {orders.map(order => (
                  <option key={order.mahoadon} value={order.mahoadon}>
                    {getOrderOptionLabel(order)}
                  </option>
                ))}
              </select>

              {/* Order Preview Card */}
              {selectedOrder && (
                <div className="bg-brand-bg/40 border border-brand-light rounded-xl p-3.5 space-y-2.5 mt-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-brand-light">
                    <span className="font-bold text-brand-dark flex items-center gap-1.5">
                      <ShoppingBag size={14} className="text-brand-primary" />
                      Đơn hàng #{selectedOrder.mahoadon}
                    </span>
                    <span className="font-bold text-brand-accent">
                      Tổng tiền: {formatVND(selectedOrder.tongtientt || 0)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedOrderItems.map((sp, idx) => {
                      const pId = sp.maSanpham || sp.masanpham;
                      const prodInfo = products.find(p => p.masanpham === pId);
                      const img = sp.hinhAnh || prodInfo?.hinhanh;
                      const name = sp.tenSanpham || prodInfo?.tensanpham || `Sản phẩm ${pId}`;
                      const qty = sp.soLuong || sp.soluong || 1;
                      const isSelectedProd = maSanpham === pId;

                      return (
                        <div
                          key={idx}
                          onClick={() => setMaSanpham(pId)}
                          className={`flex items-center justify-between gap-3 p-2 rounded-lg border transition cursor-pointer ${
                            isSelectedProd
                              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                              : 'bg-white border-brand-light hover:border-brand-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {img ? (
                              <img src={img} alt={name} className="w-10 h-10 object-cover rounded-lg border border-brand-light shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
                                <Package size={16} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-brand-dark text-xs truncate">{name}</p>
                              <p className="text-[11px] text-gray-400">Số lượng: x{qty}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {isSelectedProd && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                Đã chọn
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Product Linkage */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                Sản phẩm liên quan (Không bắt buộc)
              </label>
              <select
                value={maSanpham}
                onChange={e => setMaSanpham(e.target.value)}
                className="w-full bg-brand-bg text-brand-dark text-sm px-4 py-3 rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary transition"
              >
                <option value="">-- Không liên kết sản phẩm cụ thể --</option>
                {selectedOrderItems.length > 0 && (
                  <optgroup label="Sản phẩm trong đơn hàng đã chọn">
                    {selectedOrderItems.map(sp => {
                      const pId = sp.maSanpham || sp.masanpham;
                      const prod = products.find(p => p.masanpham === pId);
                      const pName = sp.tenSanpham || prod?.tensanpham || `Sản phẩm ${pId}`;
                      return (
                        <option key={pId} value={pId}>
                          {pName} (x{sp.soLuong || sp.soluong || 1})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                <optgroup label="Tất cả sản phẩm khác">
                  {products.map(prod => (
                    <option key={prod.masanpham} value={prod.masanpham}>
                      {prod.tensanpham}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Request content details */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Nội dung chi tiết</label>
              <textarea
                rows={6}
                value={noiDungKH}
                onChange={e => setNoiDungKH(e.target.value)}
                placeholder="Vui lòng nhập chi tiết phản hồi hoặc khiếu nại của bạn tại đây để nhân viên hỗ trợ nhanh nhất..."
                className="w-full bg-brand-bg text-brand-dark text-sm p-4 rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary transition resize-none placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitRequest.isPending}
              className="w-full flex items-center justify-center gap-2 bg-brand-primary text-brand-dark font-bold py-4 rounded-xl hover:bg-brand-primary/90 transition text-sm shadow-sm disabled:opacity-50"
            >
              {submitRequest.isPending ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gửi yêu cầu hỗ trợ
                </>
              )}
            </button>

          </form>
        </div>

        {/* History of Support Requests */}
        <div className="bg-white rounded-3xl border border-brand-light p-6 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-xl font-bold font-heading text-brand-dark flex items-center gap-2">
            <MessageSquare className="text-brand-primary" /> Lịch sử Yêu cầu của bạn
          </h2>
          
          {myRequests.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">Bạn chưa gửi yêu cầu hỗ trợ nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div key={req.mayeucau} className="p-4 border border-brand-light rounded-2xl space-y-3 hover:border-brand-primary transition">
                  <div className="flex flex-wrap gap-2 justify-between items-start">
                    <div>
                      <span className="text-xs font-bold px-2 py-1 bg-brand-bg rounded-lg text-brand-dark mr-2">
                        {req.loaiyeucau}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(req.ngaytao).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      req.trangthai === 'Đã xử lý' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {req.trangthai}
                    </span>
                  </div>
                  <div className="text-sm text-brand-dark mt-2 bg-gray-50 p-3 rounded-xl">
                    <strong>Nội dung:</strong> {req.noidungkh}
                  </div>
                  {req.noidungphanhoi && (
                    <div className="text-sm bg-brand-primary/10 text-brand-dark p-3 rounded-xl border border-brand-primary/20">
                      <strong>CSKH phản hồi:</strong> {req.noidungphanhoi}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
