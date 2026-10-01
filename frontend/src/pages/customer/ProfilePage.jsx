import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { contentApi } from '../../api/contentApi';
import { User, MessageSquare, Loader2, Save, Lock, Eye, EyeOff, Pencil, X, CheckCircle, ShieldCheck, MapPin, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'info');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['info', 'addresses', 'password', 'requests'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // --- Edit mode state for info tab ---
  const [isEditing, setIsEditing] = useState(false);

  // --- Address state ---
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressText, setAddressText] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  // --- Password verification state ---
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Fetch logged-in customer profile
  const { data: customer, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['my-profile'],
    retry: false,
    queryFn: async () => {
      const res = await customerApi.getMe();
      return res.data;
    }
  });

  // Fetch support requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-support-requests'],
    enabled: !!customer,
    queryFn: async () => {
      const res = await contentApi.getMySupportRequests();
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // State for form
  const [formData, setFormData] = useState({
    hoTen: '',
    sdt: '',
    email: '',
    ngaySinh: ''
  });

  // State for password change
  const [passwordData, setPasswordData] = useState({
    matKhauCu: '',
    matKhauMoi: '',
    xacNhanMatKhau: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        hoTen: customer.hoten || '',
        sdt: customer.sdt || '',
        email: customer.email || '',
        ngaySinh: customer.ngaysinh ? customer.ngaysinh.split('T')[0] : ''
      });
    }
  }, [customer]);

  // Reset password tab state when switching tabs
  useEffect(() => {
    if (activeTab !== 'password') {
      setIsPasswordVerified(false);
      setVerifyError('');
      setPasswordError('');
      setPasswordData({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhau: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  }, [activeTab]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => customerApi.update('me', data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công!');
      queryClient.invalidateQueries(['my-profile']);
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => customerApi.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      setPasswordData({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhau: '' });
      setPasswordError('');
      setIsPasswordVerified(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại';
      setPasswordError(msg);
      toast.error(msg);
    }
  });

  // --- Address Mutations & Handlers ---
  const addAddressMutation = useMutation({
    mutationFn: (data) => customerApi.addAddress('me', data),
    onSuccess: () => {
      toast.success('Thêm địa chỉ nhận hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setShowAddressModal(false);
      setAddressText('');
      setAddressIsDefault(false);
      setEditingAddress(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể thêm địa chỉ')
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ addressId, data }) => customerApi.updateAddress('me', addressId, data),
    onSuccess: () => {
      toast.success('Cập nhật địa chỉ nhận hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setShowAddressModal(false);
      setAddressText('');
      setAddressIsDefault(false);
      setEditingAddress(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể cập nhật địa chỉ')
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId) => customerApi.deleteAddress('me', addressId),
    onSuccess: () => {
      toast.success('Xóa địa chỉ thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setAddressToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể xóa địa chỉ')
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId) => customerApi.setDefaultAddress('me', addressId),
    onSuccess: () => {
      toast.success('Thiết lập địa chỉ mặc định thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể đặt làm địa chỉ mặc định')
  });

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressText('');
    setAddressIsDefault(!customer?.diaChi || customer.diaChi.length === 0);
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressText(addr.diachichitiet || addr.diaChiChiTiet || '');
    setAddressIsDefault(!!addr.lamacdinh);
    setShowAddressModal(true);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!addressText.trim()) {
      toast.error('Vui lòng nhập địa chỉ chi tiết');
      return;
    }

    if (editingAddress) {
      const addrId = editingAddress.madiaChi || editingAddress.madiachi;
      updateAddressMutation.mutate({
        addressId: addrId,
        data: {
          diaChiChiTiet: addressText.trim(),
          laMacDinh: addressIsDefault
        }
      });
    } else {
      addAddressMutation.mutate({
        diaChiChiTiet: addressText.trim(),
        laMacDinh: addressIsDefault || !customer?.diaChi || customer.diaChi.length === 0
      });
    }
  };

  const handleCancelEdit = () => {
    // Revert form data to original customer data
    if (customer) {
      setFormData({
        hoTen: customer.hoten || '',
        sdt: customer.sdt || '',
        email: customer.email || '',
        ngaySinh: customer.ngaysinh ? customer.ngaysinh.split('T')[0] : ''
      });
    }
    setIsEditing(false);
  };

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    if (!formData.hoTen || !formData.sdt) {
      toast.error('Họ tên và Số điện thoại là bắt buộc');
      return;
    }
    if (!/^\d{10}$/.test(formData.sdt)) {
      toast.error('Số điện thoại phải gồm đúng 10 chữ số');
      return;
    }
    if (formData.ngaySinh && formData.ngaySinh > '2008-12-31') {
      toast.error('Bạn phải đủ 18 tuổi trở lên');
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  // Step 1: Verify current password
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifyError('');

    if (!passwordData.matKhauCu) {
      setVerifyError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    setVerifyingPassword(true);
    try {
      await customerApi.verifyPassword({ matKhau: passwordData.matKhauCu });
      setIsPasswordVerified(true);
      setVerifyError('');
      toast.success('Xác thực mật khẩu thành công!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Mật khẩu không chính xác';
      setVerifyError(msg);
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Step 2: Change password (after verified)
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordData.matKhauMoi) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (passwordData.matKhauMoi !== passwordData.xacNhanMatKhau) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }
    if (passwordData.matKhauMoi.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(passwordData.matKhauMoi)) {
      setPasswordError('Mật khẩu mới phải bao gồm chữ hoa, chữ thường và số');
      return;
    }

    changePasswordMutation.mutate({
      matKhauCu: passwordData.matKhauCu,
      matKhauMoi: passwordData.matKhauMoi
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500">
        Vui lòng đăng nhập để xem thông tin tài khoản.
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Sidebar Tabs */}
        <div className="col-span-1 space-y-2">
          <button
            onClick={() => handleTabChange('info')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'info' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
              }`}
          >
            <User size={20} /> Thông tin cá nhân
          </button>

          <button
            onClick={() => handleTabChange('addresses')}
            className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'addresses' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
              }`}
          >
            <div className="flex items-center gap-3">
              <MapPin size={20} /> Địa chỉ nhận hàng
            </div>
            {customer?.diaChi && customer.diaChi.length > 0 && (
              <span className="bg-brand-light text-brand-dark text-xs px-2 py-0.5 rounded-full font-bold">
                {customer.diaChi.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('password')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'password' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
              }`}
          >
            <Lock size={20} /> Đổi mật khẩu
          </button>

          <button
            onClick={() => handleTabChange('requests')}
            className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'requests' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
              }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} /> Phản hồi CSKH
            </div>
            {myRequests.some(r => r.trangthai === 'Đã xử lý') && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">!</span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-3xl border border-brand-light p-8 shadow-sm">

          {/* TAB: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brand-light pb-4">
                <h2 className="text-2xl font-bold text-brand-dark font-heading">
                  Hồ sơ của tôi
                </h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-bold text-brand-dark bg-brand-primary/20 hover:bg-brand-primary/40 px-4 py-2 rounded-xl transition-all"
                  >
                    <Pencil size={16} />
                    Sửa thông tin
                  </button>
                )}
              </div>
              <form onSubmit={handleUpdateInfo} className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={formData.hoTen}
                    onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-brand-bg border-brand-light focus:outline-none focus:border-brand-primary'
                        : 'bg-gray-50 border-gray-200 text-gray-600 cursor-default'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Số điện thoại *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.sdt}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, sdt: val });
                    }}
                    disabled={!isEditing}
                    placeholder="Nhập 10 chữ số"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      !isEditing
                        ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-default'
                        : formData.sdt && !/^\d{10}$/.test(formData.sdt)
                          ? 'bg-brand-bg border-red-400 focus:outline-none focus:border-red-500'
                          : 'bg-brand-bg border-brand-light focus:outline-none focus:border-brand-primary'
                    }`}
                  />
                  {isEditing && formData.sdt && !/^\d{10}$/.test(formData.sdt) && (
                    <p className="text-xs text-red-500 mt-1">Số điện thoại phải gồm đúng 10 chữ số</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-brand-light text-gray-500 cursor-not-allowed"
                    title="Email đăng nhập không thể thay đổi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.ngaySinh}
                    max="2008-12-31"
                    onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-brand-bg border-brand-light focus:outline-none focus:border-brand-primary'
                        : 'bg-gray-50 border-gray-200 text-gray-600 cursor-default'
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1">Phải đủ 18 tuổi trở lên</p>
                </div>

                {isEditing && (
                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-2 bg-brand-dark text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-dark/90 transition-all disabled:opacity-50"
                    >
                      {updateProfileMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Lưu thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-2 bg-gray-100 text-gray-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      <X size={20} />
                      Hủy
                    </button>
                  </div>
                )}
              </form>

              {/* Default Address Section */}
              <div className="pt-6 border-t border-brand-light max-w-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-brand-dark">
                    <MapPin size={18} className="text-brand-primary" />
                    <span>Địa chỉ nhận hàng mặc định</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('addresses')}
                    className="text-xs font-bold text-brand-accent hover:underline"
                  >
                    Quản lý tất cả địa chỉ ({customer?.diaChi?.length || 0})
                  </button>
                </div>

                {(() => {
                  const defaultAddr = customer?.diaChi?.find(a => a.lamacdinh) || customer?.diaChi?.[0];
                  if (defaultAddr) {
                    return (
                      <div className="p-4 bg-brand-bg/60 rounded-2xl border border-brand-light flex items-start justify-between gap-4">
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-brand-dark break-words">
                            {defaultAddr.diachichitiet || defaultAddr.diaChiChiTiet}
                          </p>
                          {defaultAddr.lamacdinh && (
                            <span className="inline-block bg-brand-light text-brand-dark font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(defaultAddr)}
                          className="text-xs font-bold text-brand-accent hover:text-brand-dark px-2.5 py-1.5 rounded-lg hover:bg-brand-primary/10 transition flex items-center gap-1 shrink-0"
                        >
                          <Pencil size={13} /> Sửa
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500 flex items-center justify-between">
                      <span>Bạn chưa thiết lập địa chỉ nhận hàng nào.</span>
                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Thêm địa chỉ
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-light pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark font-heading">
                    Địa chỉ nhận hàng
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Quản lý danh sách địa chỉ nhận hàng để thanh toán nhanh chóng và tiện lợi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="flex items-center gap-2 text-sm font-bold text-brand-dark bg-brand-primary hover:bg-brand-primary/90 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Plus size={18} />
                  Thêm địa chỉ mới
                </button>
              </div>

              {(!customer.diaChi || customer.diaChi.length === 0) ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                  <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto text-brand-dark">
                    <MapPin size={24} />
                  </div>
                  <p className="text-sm font-bold text-brand-dark">Bạn chưa có địa chỉ nhận hàng nào</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Thêm địa chỉ nhận hàng giúp bạn dễ dàng hoàn tất đơn hàng chỉ trong vài thao tác.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark bg-brand-primary px-4 py-2 rounded-xl hover:bg-brand-primary/90 transition shadow-sm mt-2"
                  >
                    <Plus size={16} /> Thêm ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.diaChi.map((addr) => {
                    const addrId = addr.madiaChi || addr.madiachi;
                    const isDefault = !!addr.lamacdinh;
                    return (
                      <div
                        key={addrId}
                        className={`p-5 rounded-2xl border transition-all ${
                          isDefault
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-brand-light bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-brand-dark text-sm">{customer.hoten}</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-500 text-sm">{customer.sdt}</span>
                              {isDefault && (
                                <span className="bg-brand-primary/20 text-brand-dark text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-brand-primary/30">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 break-words leading-relaxed">
                              {addr.diachichitiet || addr.diaChiChiTiet}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-start">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
                            >
                              <Pencil size={13} /> Sửa
                            </button>

                            {customer.diaChi.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setAddressToDelete(addr)}
                                className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
                              >
                                <Trash2 size={13} /> Xóa
                              </button>
                            )}

                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => setDefaultAddressMutation.mutate(addrId)}
                                disabled={setDefaultAddressMutation.isPending}
                                className="text-xs font-semibold px-3 py-1.5 border border-brand-light rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                              >
                                Thiết lập mặc định
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: PASSWORD */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-brand-dark font-heading border-b border-brand-light pb-4">
                Đổi mật khẩu
              </h2>

              {/* Step 1: Verify current password */}
              {!isPasswordVerified ? (
                <div className="space-y-5 max-w-2xl">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                    <span>Vui lòng xác nhận mật khẩu hiện tại trước khi đổi mật khẩu mới.</span>
                  </div>

                  {verifyError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {verifyError}
                    </div>
                  )}

                  <form onSubmit={handleVerifyPassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-brand-dark mb-2">Mật khẩu hiện tại *</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.matKhauCu}
                          onChange={(e) => setPasswordData({ ...passwordData, matKhauCu: e.target.value })}
                          placeholder="Nhập mật khẩu hiện tại"
                          autoFocus
                          className="w-full px-4 py-3 bg-brand-bg rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={verifyingPassword}
                        className="flex items-center gap-2 bg-brand-dark text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-dark/90 transition-all disabled:opacity-50"
                      >
                        {verifyingPassword ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                        Xác nhận
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Step 2: Enter new password (after verified) */
                <div className="space-y-5 max-w-2xl">
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle size={18} className="shrink-0" />
                    <span>Mật khẩu hiện tại đã được xác nhận. Vui lòng nhập mật khẩu mới.</span>
                  </div>

                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-brand-dark mb-2">Mật khẩu mới *</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.matKhauMoi}
                          onChange={(e) => setPasswordData({ ...passwordData, matKhauMoi: e.target.value })}
                          placeholder="Nhập mật khẩu mới"
                          autoFocus
                          className="w-full px-4 py-3 bg-brand-bg rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-brand-dark mb-2">Xác nhận mật khẩu mới *</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.xacNhanMatKhau}
                          onChange={(e) => setPasswordData({ ...passwordData, xacNhanMatKhau: e.target.value })}
                          placeholder="Nhập lại mật khẩu mới"
                          className={`w-full px-4 py-3 bg-brand-bg rounded-xl border focus:outline-none pr-12 ${passwordData.xacNhanMatKhau && passwordData.matKhauMoi !== passwordData.xacNhanMatKhau
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-brand-light focus:border-brand-primary'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordData.xacNhanMatKhau && passwordData.matKhauMoi !== passwordData.xacNhanMatKhau && (
                        <p className="text-xs text-red-500 mt-1">Mật khẩu xác nhận không khớp</p>
                      )}
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="flex items-center gap-2 bg-brand-dark text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-dark/90 transition-all disabled:opacity-50"
                      >
                        {changePasswordMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                        Đổi mật khẩu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPasswordVerified(false);
                          setPasswordData({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhau: '' });
                          setPasswordError('');
                        }}
                        className="flex items-center gap-2 bg-gray-100 text-gray-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-all"
                      >
                        <X size={20} />
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brand-light pb-4">
                <h2 className="text-2xl font-bold text-brand-dark font-heading">
                  Yêu cầu & Phản hồi từ CSKH
                </h2>
              </div>

              {myRequests.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">Bạn chưa gửi yêu cầu hỗ trợ nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((req) => (
                    <div key={req.mayeucau} className={`p-5 border rounded-2xl space-y-3 transition ${req.trangthai === 'Đã xử lý' ? 'border-brand-primary bg-brand-bg/50' : 'border-brand-light hover:border-brand-primary'
                      }`}>
                      <div className="flex flex-wrap gap-2 justify-between items-start">
                        <div>
                          <span className="text-xs font-bold px-2 py-1 bg-brand-light rounded-lg text-brand-dark mr-2">
                            {req.loaiyeucau}
                          </span>
                          <span className="text-xs text-gray-500">
                            Gửi ngày: {new Date(req.ngaytao).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${req.trangthai === 'Đã xử lý' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {req.trangthai}
                        </span>
                      </div>

                      <div className="text-sm text-brand-dark mt-2 bg-white border border-gray-100 p-4 rounded-xl">
                        <strong className="block text-xs text-gray-400 uppercase mb-1">Nội dung bạn gửi:</strong>
                        {req.noidungkh}
                      </div>

                      {req.noidungphanhoi ? (
                        <div className="text-sm bg-brand-primary/10 text-brand-dark p-4 rounded-xl border border-brand-primary/20 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                          <strong className="block text-xs text-brand-primary uppercase mb-1">Admin / CSKH Phản hồi:</strong>
                          {req.noidungphanhoi}
                          <div className="text-xs text-gray-500 mt-2">
                            Vào lúc: {new Date(req.ngayxuly).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Đang chờ nhân viên phản hồi...</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddressModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-brand-light pb-3">
              <h3 className="font-bold font-heading text-brand-dark text-base">
                {editingAddress ? 'Cập nhật địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-dark">Địa chỉ nhận hàng chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  value={addressText}
                  onChange={e => setAddressText(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className="w-full px-4 py-3 bg-brand-bg rounded-xl border border-brand-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-brand-dark select-none">
                <input
                  type="checkbox"
                  checked={addressIsDefault}
                  onChange={(e) => setAddressIsDefault(e.target.checked)}
                  className="rounded border-brand-light text-brand-primary focus:ring-brand-primary"
                />
                <span>Đặt làm địa chỉ nhận hàng mặc định</span>
              </label>
              <div className="flex gap-3 pt-3 border-t border-brand-light">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 border border-brand-light text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                  className="flex-1 bg-brand-primary text-brand-dark font-bold py-2.5 rounded-xl text-sm hover:bg-brand-primary/95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {(addAddressMutation.isPending || updateAddressMutation.isPending) ? <Loader2 className="animate-spin" size={16} /> : null}
                  {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ADDRESS CONFIRMATION MODAL */}
      {addressToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddressToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold font-heading text-brand-dark text-base">Xóa địa chỉ nhận hàng</h3>
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa địa chỉ:
              <span className="font-semibold block text-brand-dark mt-1">
                "{addressToDelete.diachichitiet || addressToDelete.diaChiChiTiet}"
              </span>
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                className="flex-1 border border-brand-light text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => deleteAddressMutation.mutate(addressToDelete.madiaChi || addressToDelete.madiachi)}
                disabled={deleteAddressMutation.isPending}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleteAddressMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
