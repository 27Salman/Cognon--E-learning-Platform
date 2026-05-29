import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/adminAPI';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const initialForm = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscountAmount: '',
    minPurchaseAmount: '',
    perUserLimit: 1,
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    applicableTo: 'all',
    applicableIds: [],
};

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [pagination, setPagination] = useState({});
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [courses, setCourses] = useState([]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getCoupons({ page, limit: 10, search });
            setCoupons(res.data.coupons || []);
            setPagination(res.data.pagination || {});
        } catch {
            toast.error('Failed to load coupons', { id: 'coupons-error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [catRes, courseRes] = await Promise.all([
                    adminAPI.getCategories({ limit: 100 }),
                    adminAPI.getAdminCourses({ limit: 100, status: 'published' }),
                ]);
                setCategories(catRes.data?.categories || []);
                setCourses(courseRes.data?.courses || []);
            } catch {
            }
        };
        loadOptions();
    }, []);

    useEffect(() => { fetchCoupons(); }, [page, search]);

    const openCreate = () => {
        setEditingId(null);
        setForm(initialForm);
        setShowModal(true);
    };

    const openEdit = (coupon) => {
        setEditingId(coupon._id);
        setForm({
            code: coupon.code,
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscountAmount: coupon.maxDiscountAmount || '',
            minPurchaseAmount: coupon.minPurchaseAmount || '',
            perUserLimit: coupon.perUserLimit || 1,
            usageLimit: coupon.usageLimit || '',
            validFrom: coupon.validFrom?.split('T')[0] || '',
            validUntil: coupon.validUntil?.split('T')[0] || '',
            applicableTo: coupon.applicableTo || 'all',
            applicableIds: (coupon.applicableIds || []).map(item =>
                typeof item === 'object' ? item._id || item : item
            ),
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.code || !form.discountValue || !form.validFrom || !form.validUntil) {
            return toast.error('Please fill all required fields');
        }

        const discountVal = Number(form.discountValue);
        const minPurchase = Number(form.minPurchaseAmount) || 0;
        const maxDiscount = form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null;

        if (form.discountType === 'fixed' && minPurchase > 0 && discountVal >= minPurchase) {
            return toast.error(`Fixed discount (₹${discountVal}) must be less than minimum purchase amount (₹${minPurchase})`);
        }

        if (discountVal <= 0) {
            return toast.error('Discount value must be greater than 0');
        }

        if (form.discountType === 'percentage' && (discountVal <= 0 || discountVal > 100)) {
            return toast.error('Percentage discount must be between 1 and 100');
        }

        if (form.discountType === 'percentage' && maxDiscount && minPurchase > 0 && maxDiscount >= minPurchase) {
            return toast.error(`Max discount cap (₹${maxDiscount}) must be less than minimum purchase amount (₹${minPurchase})`);
        }

        if (form.validFrom && form.validUntil && form.validUntil <= form.validFrom) {
            return toast.error('Expiry date must be after start date');
        }

        if (form.applicableTo === 'category' && form.applicableIds.length === 0) {
            return toast.error('Please select at least one category');
        }

        if (submitting) return;
        setSubmitting(true);
        try {
            const payload = {
                code: form.code.toUpperCase(),
                description: form.description,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
                minPurchaseAmount: Number(form.minPurchaseAmount) || 0,
                perUserLimit: Number(form.perUserLimit) || 1,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                validFrom: form.validFrom,
                validUntil: form.validUntil,
                applicableTo: form.applicableTo,
                applicableIds: form.applicableTo !== 'all' ? form.applicableIds : [],
            };

            if (editingId) {
                await adminAPI.updateCoupon(editingId, payload);
                toast.success('Coupon updated');
            } else {
                await adminAPI.createCoupon(payload);
                toast.success('Coupon created');
            }
            setShowModal(false);
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await adminAPI.deleteCoupon(id);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const handleToggle = async (id) => {
        try {
            await adminAPI.toggleCouponStatus(id);
            toast.success('Status updated');
            fetchCoupons();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const isExpired = (date) => new Date(date) < new Date();

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Coupon Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Create and manage platform-wide discount codes</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Create Coupon
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5 w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by code or description..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Code</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Description</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Discount</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Min Amount</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Usage</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Validity</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-10 text-gray-400">No coupons yet</td></tr>
                        ) : coupons.map((coupon) => (
                            <tr key={coupon._id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 font-mono font-bold text-purple-700">{coupon.code}</td>
                                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{coupon.description || '—'}</td>
                                <td className="px-5 py-3 font-medium text-gray-800">
                                    {coupon.discountType === 'percentage'
                                        ? `${coupon.discountValue}%${coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}`
                                        : `₹${coupon.discountValue}`}
                                </td>
                                <td className="px-5 py-3 text-gray-600">₹{coupon.minPurchaseAmount || 0}</td>
                                <td className="px-5 py-3 text-gray-600">{coupon.usageCount}/{coupon.usageLimit || '∞'}</td>
                                <td className="px-5 py-3 text-xs text-gray-600">
                                    <div>{new Date(coupon.validFrom).toLocaleDateString('en-IN')}</div>
                                    <div className={isExpired(coupon.validUntil) ? 'text-red-500' : ''}>
                                        → {new Date(coupon.validUntil).toLocaleDateString('en-IN')}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        coupon.isActive && !isExpired(coupon.validUntil)
                                            ? 'bg-green-100 text-green-700'
                                            : isExpired(coupon.validUntil)
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {isExpired(coupon.validUntil) ? 'Expired' : coupon.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(coupon)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleToggle(coupon._id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="Toggle status">
                                            {coupon.isActive
                                                ? <ToggleRight className="w-6 h-6 text-green-600" />
                                                : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                                        </button>
                                        <button onClick={() => handleDelete(coupon._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-full text-sm font-medium ${
                                p === page ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}>
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {editingId ? 'Edit Coupon' : 'Create New Coupon'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="SAVE20"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={2}
                                        placeholder="e.g. 20% off for new students"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    />
                                </div>

                                {/* Discount Type + Value + Max */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                        <select
                                            value={form.discountType}
                                            onChange={e => setForm({ ...form, discountType: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                                        <input
                                            type="number"
                                            value={form.discountValue}
                                            onChange={e => setForm({ ...form, discountValue: e.target.value })}
                                            placeholder={form.discountType === 'percentage' ? '20' : '500'}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    {form.discountType === 'percentage' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                                            <input
                                                type="number"
                                                value={form.maxDiscountAmount}
                                                onChange={e => setForm({ ...form, maxDiscountAmount: e.target.value })}
                                                placeholder="1000"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Applicable To */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Applicable To</label>
                                    <select
                                        value={form.applicableTo}
                                        onChange={e => setForm({ ...form, applicableTo: e.target.value, applicableIds: [] })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="all">All Courses</option>
                                        <option value="category">Specific Category</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {form.applicableTo === 'all'
                                            ? 'Coupon applies to all courses on the platform'
                                            : 'Coupon applies only to courses in the selected categories'}
                                    </p>
                                </div>

                                {/* Category selector — shown only when applicableTo = category */}
                                {form.applicableTo === 'category' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Categories *
                                        </label>
                                        {categories.length === 0 ? (
                                            <p className="text-xs text-gray-400">Loading categories...</p>
                                        ) : (
                                            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                                                {categories.map(cat => (
                                                    <label key={cat._id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={form.applicableIds.includes(cat._id)}
                                                            onChange={e => {
                                                                const ids = e.target.checked
                                                                    ? [...form.applicableIds, cat._id]
                                                                    : form.applicableIds.filter(id => id !== cat._id);
                                                                setForm({ ...form, applicableIds: ids });
                                                            }}
                                                            className="accent-purple-600"
                                                        />
                                                        <span className="text-sm text-gray-700">{cat.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {form.applicableTo === 'category' && form.applicableIds.length === 0 && (
                                            <p className="text-xs text-red-500 mt-1">Select at least one category</p>
                                        )}
                                    </div>
                                )}

                                {/* Min Amount + Per User Limit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase (₹)</label>
                                        <input
                                            type="number"
                                            value={form.minPurchaseAmount}
                                            onChange={e => setForm({ ...form, minPurchaseAmount: e.target.value })}
                                            placeholder="0"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Usage Per User</label>
                                        <input
                                            type="number"
                                            value={form.perUserLimit}
                                            onChange={e => setForm({ ...form, perUserLimit: e.target.value })}
                                            min="1"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                {/* Dates + Total Usage Limit */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            value={form.validFrom}
                                            onChange={e => setForm({ ...form, validFrom: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                        <input
                                            type="date"
                                            value={form.validUntil}
                                            onChange={e => setForm({ ...form, validUntil: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                                        <input
                                            type="number"
                                            value={form.usageLimit}
                                            onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                                            placeholder="Unlimited"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
