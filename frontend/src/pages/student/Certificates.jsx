import { useEffect, useState, useCallback } from 'react';
import { Award, Download, BookOpen, User, Calendar, Eye, X, Link2, Check, Search } from 'lucide-react';
import { studentAPI } from '../../api/studentAPI';
import toast from 'react-hot-toast';

const Certificates = () => {
    const [certificates, setCertificates]   = useState([]);
    const [pagination, setPagination]       = useState(null);
    const [loading, setLoading]             = useState(true);
    const [page, setPage]                   = useState(1);
    const [downloadingId, setDownloadingId] = useState(null);
    const [previewCert, setPreviewCert]     = useState(null);

    const [searchTerm, setSearchTerm]       = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortOption, setSortOption]       = useState('latest');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); 
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchCertificates = useCallback(async (pageNum = 1, search = '', sort = 'latest') => {
        setLoading(true);
        try {
            const res = await studentAPI.getCertificates(pageNum, 9, search, sort);
            setCertificates(res.data.certificates || []);
            setPagination(res.data.pagination);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load certificates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchCertificates(page, debouncedSearch, sortOption); 
    }, [page, debouncedSearch, sortOption, fetchCertificates]);

    const handleDownload = async (cert) => {
        setDownloadingId(cert._id);
        try {
            const response = await studentAPI.downloadCertificate(cert._id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href     = url;
            link.download = `certificate-${cert.course?.title || cert._id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Certificate downloaded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Download failed');
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading certificates...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-xl">
                            <Award className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">My Certificates</h1>
                            <p className="text-sm text-gray-500">
                                {pagination?.totalCertificates ?? 0} certificate
                                {pagination?.totalCertificates !== 1 ? 's' : ''} found
                            </p>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search by course..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <select
                            value={sortOption}
                            onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                        >
                            <option value="latest">Latest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="score_desc">Highest Score</option>
                            <option value="score_asc">Lowest Score</option>
                        </select>
                        {(searchTerm || sortOption !== 'latest') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSortOption('latest');
                                    setPage(1);
                                }}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <X className="w-4 h-4" /> Clear
                            </button>
                        )}
                    </div>
                </div>



                {certificates.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                        <Award className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">No certificates yet</h2>
                        <p className="text-gray-400 max-w-sm mx-auto">
                            Complete a course and pass the quiz to earn your first certificate.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {certificates.map((cert) => (
                                <CertificateCard
                                    key={cert._id}
                                    cert={cert}
                                    onDownload={handleDownload}
                                    onPreview={() => setPreviewCert(cert)}
                                    isDownloading={downloadingId === cert._id}
                                />
                            ))}
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {previewCert && (
                <CertificatePreviewModal
                    cert={previewCert}
                    onClose={() => setPreviewCert(null)}
                    onDownload={handleDownload}
                    isDownloading={downloadingId === previewCert._id}
                />
            )}
        </div>
    );
};

// Card
const CertificateCard = ({ cert, onDownload, onPreview, isDownloading }) => {
    const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-2 bg-gradient-to-r from-yellow-300 to-yellow-600" />
            <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-violet-50 rounded-lg shrink-0">
                        <BookOpen className="w-4 h-4 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                        {cert.course?.title || 'Course'}
                    </h3>
                </div>

                <div className="space-y-2 mb-5">
                    <MetaRow icon={<User className="w-3.5 h-3.5" />}     label="Instructor" value={cert.course?.tutor?.name || '—'} />
                    <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Issued"     value={issuedDate} />
                    <MetaRow icon={<Award className="w-3.5 h-3.5" />}    label="Course"     value={<span className="truncate max-w-[160px] block">{cert.course?.title || '—'}</span>} />
                </div>

                <div className="flex gap-2">
                    <button onClick={onPreview}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Eye className="w-4 h-4" />
                        View
                    </button>
                    <button onClick={() => onDownload(cert)} disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-violet-700 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                        {isDownloading
                            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />PDF...</>
                            : <><Download className="w-4 h-4" />Download</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* Preview modal*/
const CertificatePreviewModal = ({ cert, onClose, onDownload, isDownloading }) => {
    const studentName = cert.student?.name           || 'Student';
    const courseName  = cert.course?.title           || 'Course';
    const tutorName   = cert.course?.tutor?.name     || 'Cognon Instructor';
    const certNumber  = cert.certificateNumber;
    const issuedDate  = new Date(cert.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/verify/${certNumber}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            toast.success('Verification link copied!');
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
             onClick={handleBackdrop}>
            <div className="w-full max-w-4xl">

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-white/50 text-sm">Certificate Preview</span>
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                            {copied
                                ? <><Check className="w-4 h-4 text-green-400" />Copied!</>
                                : <><Link2 className="w-4 h-4" />Copy Link</>}
                        </button>
                        <button onClick={() => onDownload(cert)} disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                            {isDownloading
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
                                : <><Download className="w-4 h-4" />Download PDF</>}
                        </button>
                        <button onClick={onClose} aria-label="Close"
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Two-panel certificate */}
                <div className="w-full rounded-xl overflow-hidden shadow-2xl select-none flex"
                     style={{ aspectRatio: '842 / 595', fontFamily: 'Georgia, "Times New Roman", serif' }}>

                    {/* LEFT */}
                    <div className="flex flex-col"
                         style={{
                             width: '65%',
                             background: '#ffffff',
                             borderTop: '7px solid #2d1b69',
                             borderLeft: '7px solid #2d1b69',
                             padding: 'clamp(14px,3.5%,36px) clamp(18px,5%,52px)',
                         }}>

                        <p style={{ color: '#64748b', fontSize: 'clamp(7px,1.05vw,10px)', marginBottom: '3%' }}>
                            {issuedDate}
                        </p>

                        <p style={{ color: '#1e293b', fontSize: 'clamp(15px,3.3vw,32px)', fontWeight: 700, lineHeight: 1.1, marginBottom: '2%', letterSpacing: '0.04em' }}>
                            {studentName.toUpperCase()}
                        </p>

                        <p style={{ color: '#475569', fontSize: 'clamp(7px,1.05vw,10px)', marginBottom: '1.5%' }}>
                            has successfully completed
                        </p>

                        <p style={{ color: '#1e293b', fontSize: 'clamp(10px,1.85vw,18px)', fontWeight: 700, lineHeight: 1.3, marginBottom: '2%' }}>
                            {courseName}
                        </p>

                        <p style={{ color: '#64748b', fontSize: 'clamp(6px,0.9vw,9px)', lineHeight: 1.6, flexGrow: 1 }}>
                            an online course authorised by{' '}
                            <strong style={{ color: '#334155' }}>{tutorName}</strong>{' '}
                            and offered through Cognon
                        </p>

                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '2% 0', paddingTop: '2%' }}>
                            <p style={{ color: '#334155', fontSize: 'clamp(8px,1.15vw,11px)', fontWeight: 700, marginBottom: '0.5%' }}>
                                {tutorName}
                            </p>
                            <p style={{ color: '#64748b', fontSize: 'clamp(6px,0.85vw,8.5px)' }}>
                                Course Instructor
                            </p>
                            <p style={{ color: '#64748b', fontSize: 'clamp(6px,0.85vw,8.5px)' }}>
                                Cognon E-Learning Platform
                            </p>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: 'clamp(5px,0.7vw,7px)', marginTop: '1%' }}>
                            Certificate ID: {certNumber}
                        </p>
                    </div>

                    {/* RIGHT — purple accent panel */}
                    <div className="relative flex flex-col items-center justify-between"
                         style={{ width: '35%', background: '#2d1b69', padding: '5% 4%', overflow: 'hidden' }}>

                        <div className="absolute inset-y-0" style={{ left: '10%', width: '3%', background: 'rgba(255,255,255,0.10)' }} />
                        <div className="absolute inset-y-0" style={{ left: '18%', width: '1.5%', background: 'rgba(255,255,255,0.06)' }} />

                        <div className="text-center" style={{ zIndex: 1 }}>
                            <p style={{ color: '#ffffff', fontSize: 'clamp(8px,1.4vw,13px)', fontWeight: 700, letterSpacing: '0.22em', lineHeight: 1.4 }}>
                                COURSE
                            </p>
                            <p style={{ color: '#ffffff', fontSize: 'clamp(8px,1.4vw,13px)', fontWeight: 700, letterSpacing: '0.14em', lineHeight: 1.4 }}>
                                CERTIFICATE
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-full"
                             style={{
                                 width: 'clamp(72px,13.5vw,122px)',
                                 height: 'clamp(72px,13.5vw,122px)',
                                 border: '2px solid rgba(255,255,255,0.65)',
                                 boxShadow: 'inset 0 0 0 7px rgba(255,255,255,0.12)',
                                 zIndex: 1,
                             }}>
                            <p style={{ color: '#ffffff', fontSize: 'clamp(11px,1.9vw,18px)', fontWeight: 700, letterSpacing: '0.04em' }}>
                                Cognon
                            </p>
                            <p style={{ color: '#c4b5fd', fontSize: 'clamp(5px,0.68vw,6.5px)', letterSpacing: '0.1em', textAlign: 'center', marginTop: 3 }}>
                                E-LEARNING<br />PLATFORM
                            </p>
                        </div>

                        <div className="text-center" style={{ zIndex: 1 }}>
                            <p style={{ color: '#c4b5fd', fontSize: 'clamp(5px,0.68vw,6.5px)', lineHeight: 1.7 }}>
                                Verify at cognon.com/verify/
                            </p>
                            <p style={{ color: '#a78bfa', fontSize: 'clamp(4px,0.6vw,6px)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                                {certNumber}
                            </p>
                            <p style={{ color: '#a78bfa', fontSize: 'clamp(4.5px,0.62vw,6px)', marginTop: 5, lineHeight: 1.5 }}>
                                Cognon has confirmed the identity of<br />this learner and their completion of<br />this course.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetaRow = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="text-gray-400">{icon}</span>
        <span className="w-16 shrink-0">{label}</span>
        <span className="text-gray-700 font-medium">{value}</span>
    </div>
);

export default Certificates;
