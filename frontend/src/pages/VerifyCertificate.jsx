import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Award, Loader } from 'lucide-react';
import { certificateAPI } from '../api/certificateAPI';

const VerifyCertificate = () => {
    const { certificateNumber } = useParams();
    const [status, setStatus]   = useState('loading');
    const [cert, setCert]       = useState(null);

    useEffect(() => {
        if (!certificateNumber) { setStatus('invalid'); return; }
        certificateAPI.verifyCertificate(certificateNumber)
            .then(res => { setCert(res.data); setStatus('valid'); })
            .catch(() => setStatus('invalid'));
    }, [certificateNumber]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">

            {/* Branding */}
            <Link to="/" className="flex items-center gap-2 mb-10">
                <div className="p-2 bg-violet-700 rounded-lg">
                    <Award className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-wide">Cognon</span>
            </Link>

            {/* Loading */}
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Loader className="w-8 h-8 animate-spin text-violet-600" />
                    <p className="text-sm">Verifying certificate...</p>
                </div>
            )}

            {/* Invalid */}
            {status === 'invalid' && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Certificate Not Found</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        The certificate number{' '}
                        <span className="font-mono font-semibold text-gray-700 break-all">{certificateNumber}</span>{' '}
                        does not match any record in our system. It may be invalid or entered incorrectly.
                    </p>
                    <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
                        Go to Cognon
                    </Link>
                </div>
            )}

            {/* Valid */}
            {status === 'valid' && cert && (
                <div className="w-full max-w-3xl">

                    {/* Verified badge */}
                    <div className="flex items-center justify-center gap-2 mb-5">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-700 font-semibold text-lg">Certificate Verified</span>
                    </div>

                    {/* Two-panel certificate — same design as the preview modal */}
                    <div className="w-full rounded-xl overflow-hidden shadow-xl flex"
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
                                {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p style={{ color: '#1e293b', fontSize: 'clamp(15px,3.3vw,32px)', fontWeight: 700, lineHeight: 1.1, marginBottom: '2%', letterSpacing: '0.04em' }}>
                                {cert.studentName?.toUpperCase()}
                            </p>
                            <p style={{ color: '#475569', fontSize: 'clamp(7px,1.05vw,10px)', marginBottom: '1.5%' }}>
                                has successfully completed
                            </p>
                            <p style={{ color: '#1e293b', fontSize: 'clamp(10px,1.85vw,18px)', fontWeight: 700, lineHeight: 1.3, marginBottom: '2%' }}>
                                {cert.courseName}
                            </p>
                            <p style={{ color: '#64748b', fontSize: 'clamp(6px,0.9vw,9px)', lineHeight: 1.6, flexGrow: 1 }}>
                                an online course authorised by{' '}
                                <strong style={{ color: '#334155' }}>{cert.instructorName}</strong>{' '}
                                and offered through Cognon
                            </p>

                            <div style={{ borderTop: '1px solid #e2e8f0', margin: '2% 0', paddingTop: '2%' }}>
                                <p style={{ color: '#334155', fontSize: 'clamp(8px,1.15vw,11px)', fontWeight: 700, marginBottom: '0.5%' }}>
                                    {cert.instructorName}
                                </p>
                                <p style={{ color: '#64748b', fontSize: 'clamp(6px,0.85vw,8.5px)' }}>Course Instructor</p>
                                <p style={{ color: '#64748b', fontSize: 'clamp(6px,0.85vw,8.5px)' }}>Cognon E-Learning Platform</p>
                            </div>

                            <p style={{ color: '#94a3b8', fontSize: 'clamp(5px,0.7vw,7px)', marginTop: '1%' }}>
                                Certificate ID: {cert.certificateNumber}
                            </p>
                        </div>

                        {/* RIGHT */}
                        <div className="relative flex flex-col items-center justify-between"
                             style={{ width: '35%', background: '#2d1b69', padding: '5% 4%', overflow: 'hidden' }}>
                            <div className="absolute inset-y-0" style={{ left: '10%', width: '3%', background: 'rgba(255,255,255,0.10)' }} />
                            <div className="absolute inset-y-0" style={{ left: '18%', width: '1.5%', background: 'rgba(255,255,255,0.06)' }} />

                            <div className="text-center" style={{ zIndex: 1 }}>
                                <p style={{ color: '#ffffff', fontSize: 'clamp(8px,1.4vw,13px)', fontWeight: 700, letterSpacing: '0.22em', lineHeight: 1.4 }}>COURSE</p>
                                <p style={{ color: '#ffffff', fontSize: 'clamp(8px,1.4vw,13px)', fontWeight: 700, letterSpacing: '0.14em', lineHeight: 1.4 }}>CERTIFICATE</p>
                            </div>

                            <div className="flex flex-col items-center justify-center rounded-full"
                                 style={{ width: 'clamp(72px,13.5vw,122px)', height: 'clamp(72px,13.5vw,122px)', border: '2px solid rgba(255,255,255,0.65)', boxShadow: 'inset 0 0 0 7px rgba(255,255,255,0.12)', zIndex: 1 }}>
                                <p style={{ color: '#ffffff', fontSize: 'clamp(11px,1.9vw,18px)', fontWeight: 700, letterSpacing: '0.04em' }}>Cognon</p>
                                <p style={{ color: '#c4b5fd', fontSize: 'clamp(5px,0.68vw,6.5px)', letterSpacing: '0.1em', textAlign: 'center', marginTop: 3 }}>E-LEARNING<br />PLATFORM</p>
                            </div>

                            <div className="text-center" style={{ zIndex: 1 }}>
                                <p style={{ color: '#c4b5fd', fontSize: 'clamp(5px,0.68vw,6.5px)', lineHeight: 1.7 }}>
                                    Verify at cognon.com/verify/
                                </p>
                                <p style={{ color: '#a78bfa', fontSize: 'clamp(4px,0.6vw,6px)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                                    {cert.certificateNumber}
                                </p>
                                <p style={{ color: '#a78bfa', fontSize: 'clamp(4.5px,0.62vw,6px)', marginTop: 5, lineHeight: 1.5 }}>
                                    Cognon has confirmed the identity of<br />this learner and their completion of<br />this course.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        This certificate was issued by Cognon and has been independently verified as authentic.
                    </p>
                </div>
            )}
        </div>
    );
};

export default VerifyCertificate;
