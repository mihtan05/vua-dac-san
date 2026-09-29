import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { contentApi } from '../../api/contentApi';
import { User, MessageSquare, Loader2, Save, Lock, Eye, EyeOff, Pencil, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');

  // --- Edit mode state for info tab ---
  const [isEditing, setIsEditing] = useState(false);

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
            onClick={() => setActiveTab('info')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'info' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
              }`}
          >
            <User size={20} /> Thông tin cá nhân
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'password' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
              }`}
          >
            <Lock size={20} /> Đổi mật khẩu
          </button>

          <button
            onClick={() => setActiveTab('requests')}
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
    </div>
  );
}
