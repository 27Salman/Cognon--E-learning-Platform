import { useState, useEffect } from 'react';
import { tutorAPI } from '../../api/tutorAPI';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const initialForm = {
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscountAmount: '',
    minPurchaseAmount: '',
    perUserLimit: 1,
    usageLimit: '',
    validFrom: '',
    validUntil: ''
};

export default function TutorCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [pagination, setPagination] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await tutorAPI.getMyCoupons({ page, limit: 10 });
            setCoupons(res.data.coupons || []);
            setPagination(res.data.pagination || {});
        } catch {
            toast.error('Failed to load coupons', { id: 'coupons-error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, [page]);

    const openCreate = () => {
        setEditingId(null);
        setForm(initialForm);
        setShowModal(true);
    };

    const openEdit = (coupon) => {
        setEditingId(coupon._id);
        setForm({
            code: coupon.code,
            title: coupon.description || '',
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscountAmount: coupon.maxDiscountAmount || '',
            minPurchaseAmount: coupon.minPurchaseAmount || '',
            perUserLimit: coupon.perUserLimit || 1,
            usageLimit: coupon.usageLimit || '',
            validFrom: coupon.validFrom?.split('T')[0] || '',
            validUntil: coupon.validUntil?.split('T')[0] || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.code || !form.discountValue || !form.validFrom || !form.validUntil) {
            return toast.error('Please fill all required fields');
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            const payload = {
                code: form.code.toUpperCase(),
                description: form.title || form.description,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
                minPurchaseAmount: Number(form.minPurchaseAmount) || 0,
                perUserLimit: Number(form.perUserLimit) || 1,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                validFrom: form.validFrom,
                validUntil: form.validUntil,
                applicableTo: 'all'
            };

            if (editingId) {
                await tutorAPI.updateCoupon(editingId, payload);
                toast.success('Coupon updated', { id: 'coupon-save' });
            } else {
                await tutorAPI.createCoupon(payload);
                toast.success('Coupon created', { id: 'coupon-save' });
            }
            setShowModal(false);
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed', { id: 'coupon-error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await tutorAPI.deleteCoupon(id);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const handleToggle = async (id) => {
        try {
            await tutorAPI.toggleCoupon(id);
            toast.success('Status updated');
            fetchCoupons();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const isExpired = (date) => new Date(date) < new Date();

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Coupons</h1>
                    <p className="text-sm text-gray-500 mt-1">Create discount codes for your courses</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Create Coupon
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Code</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Discount</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Min Amount</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Usage</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Expiry</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                            <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-10 text-gray-400">No coupons yet. Create your first coupon!</td></tr>
                        ) : coupons.map((coupon) => (
                            <tr key={coupon._id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 font-mono font-bold text-purple-700">{coupon.code}</td>
                                <td className="px-5 py-3 capitalize text-gray-600">{coupon.discountType}</td>
                                <td className="px-5 py-3 font-medium text-gray-800">
                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                </td>
                                <td className="px-5 py-3 text-gray-600">₹{coupon.minPurchaseAmount || 0}</td>
                                <td className="px-5 py-3 text-gray-600">{coupon.usageCount}/{coupon.usageLimit || '∞'}</td>
                                <td className="px-5 py-3">
                                    <span className={isExpired(coupon.validUntil) ? 'text-red-500' : 'text-gray-600'}>
                                        {new Date(coupon.validUntil).toLocaleDateString()}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        coupon.isActive && !isExpired(coupon.validUntil)
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {!coupon.isActive ? 'Disabled' : isExpired(coupon.validUntil) ? 'Expired' : 'Active'}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(coupon)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleToggle(coupon._id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                                            {coupon.isActive ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                                        </button>
                                        <button onClick={() => handleDelete(coupon._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
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
                            className={`w-8 h-8 rounded-full text-sm font-medium ${p === page ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal — matches reference design */}
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
                                {/* Code + Title */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                                        <input
                                            type="text"
                                            value={form.code}
                                            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                            placeholder="SAVE20"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            placeholder="20% Off on All Courses"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={2}
                                        placeholder="Special discount for new students"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    />
                                </div>

                                {/* Discount Type + Value + Max */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                                        <select
                                            value={form.discountType}
                                            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                                        <input
                                            type="number"
                                            value={form.discountValue}
                                            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
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
                                                onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                                                placeholder="1000"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Min Amount + Usage Per User */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase (₹)</label>
                                        <input
                                            type="number"
                                            value={form.minPurchaseAmount}
                                            onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                                            placeholder="0"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Usage Per User</label>
                                        <input
                                            type="number"
                                            value={form.perUserLimit}
                                            onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                                            min="1"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                {/* Dates + Total Usage */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            value={form.validFrom}
                                            onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                        <input
                                            type="date"
                                            value={form.validUntil}
                                            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                                        <input
                                            type="number"
                                            value={form.usageLimit}
                                            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
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
