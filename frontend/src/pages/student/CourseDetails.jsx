import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCourseDetails, fetchPublishedCourses } from "../../store/slices/studentSlice";
import StudentNavbar from "../../components/student/StudentNavbar";
import Footer from "../../components/common/Footer";
import { studentAPI } from "../../api/studentAPI";
import { courseAPI } from "../../api/courseAPI";
import StarRating from "../../components/common/StarRating";
import AvatarInitial from "../../components/common/AvatarInitial";
import toast from "react-hot-toast";
import { BookOpen, Clock, Users, CheckCircle, PlayCircle, ShoppingCart, Heart } from 'lucide-react';
import { ROUTES } from "../../utils/constants";

export default function CourseDetails() {
    const { courseId: id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentCourse, loading, catalog, courseError } = useSelector(state => state.student);
    const [cartLoading, setCartLoading] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [inCart, setInCart] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
    const [summary, setSummary] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchCourseDetails(id));
        dispatch(fetchPublishedCourses({}));

        studentAPI.getWishlist().then(res => {
            const courses = res.data?.courses || [];
            setInWishlist(courses.some(c => c._id === id));
        }).catch(() => {});

        studentAPI.getCart().then(res => {
            const items = res.data?.items || [];
            setInCart(items.some(item => item.course?._id === id));
        }).catch(() => {});
    }, [dispatch, id]);

    useEffect(() => {
        if (id) {
            setReviewsPage(1);
            setReviews([]);
            loadReviews(1, true);
            loadSummary();
        }
    }, [id]);

    const loadReviews = async (page = 1, replace = false) => {
        setReviewsLoading(true);
        try {
            const res = await courseAPI.getCourseReviews(id, { page, limit: 5 });
            const data = res?.data || {};
            const fetched = data.reviews || [];
            setReviews(prev => replace ? fetched : [...prev, ...fetched]);
            setReviewsTotalPages(data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Failed to load reviews', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const res = await courseAPI.getCourseReviewSummary(id);
            setSummary(res?.data || null);
        } catch (err) {
            console.error('Failed to load review summary', err);
        }
    };

    const handleLoadMore = () => {
        const nextPage = reviewsPage + 1;
        setReviewsPage(nextPage);
        loadReviews(nextPage, false);
    };

    const handleAddToCart = async () => {
        setCartLoading(true);
        try {
            await studentAPI.addToCart(id);
            setInCart(true);
            window.dispatchEvent(new Event('cart-updated'));
            toast.success('Added to cart!');
        } catch (err) {
            const msg = err.response?.data?.message || '';
            if (msg.includes('already in your cart')) {
                setInCart(true);
                navigate(ROUTES.STUDENT_CART);
            } else {
                toast.error(msg || 'Failed to add to cart');
            }
        } finally {
            setCartLoading(false);
        }
    };

    const handleWishlist = async () => {
        setWishlistLoading(true);
        try {
            if (inWishlist) {
                await studentAPI.removeFromWishlist(id);
                setInWishlist(false);
                toast.success('Removed from wishlist');
            } else {
                await studentAPI.addToWishlist(id);
                setInWishlist(true);
                toast.success('Added to wishlist!');
            }
            window.dispatchEvent(new Event('wishlist-updated'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleEnrollNow = () => {
        navigate(ROUTES.STUDENT_CHECKOUT, { state: { directCourseId: id } });
    };

    const lessons = (currentCourse?.lessons || []).slice().sort((a, b) => a.order - b.order);
    const tutor = currentCourse?.tutor;
    const moreCourses = catalog.filter(c => c._id !== id).slice(0, 4);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="h-16 bg-white border-b animate-pulse" />
                <div className="w-full px-6 py-8 grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                    <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (!currentCourse || courseError) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StudentNavbar />
                <div className="flex-1 flex items-center justify-center px-6 py-20">
                    <div className="text-center max-w-md">
                        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                            <BookOpen className="w-12 h-12 text-purple-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Course Unavailable</h2>
                        <p className="text-gray-500 text-base leading-relaxed mb-10">
                            Sorry for the inconvenience. This course is currently unavailable. It may have been removed or unlisted by the instructor.
                        </p>
                        <button
                            onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                            className="px-8 py-3.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition text-base"
                        >
                            Browse All Courses
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const discountedPrice = currentCourse.offerPercentage > 0
        ? Math.round(currentCourse.price * (1 - currentCourse.offerPercentage / 100))
        : null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentNavbar />

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-3 px-6">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <button onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)} className="hover:text-purple-600 transition">Home</button>
                    <span className="text-gray-300">›</span>
                    <button onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)} className="hover:text-purple-600 transition">Categories</button>
                    <span className="text-gray-300">›</span>
                    <span className="text-purple-600 font-medium truncate max-w-xs">{currentCourse.title}</span>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1">
                <div className="w-full px-5 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* LEFT — course details + instructor + syllabus */}
                        <div className="flex-1 min-w-0">
                            <div className="mb-5">
                                <p className="text-xs text-purple-600 font-medium mb-1">{currentCourse.category}</p>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentCourse.title}</h1>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-bold text-yellow-600">
                                        {currentCourse.rating ? currentCourse.rating.toFixed(1) : '0.0'}
                                    </span>
                                    <StarRating rating={currentCourse.rating || 0} size={14} />
                                    <span className="text-xs text-gray-500">
                                        ({currentCourse.reviewCount || 0} rating{currentCourse.reviewCount !== 1 ? 's' : ''})
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm">{currentCourse.description}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                    {lessons.length} lessons
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    {currentCourse.enrolledCount || 0} students enrolled
                                </span>
                                {currentCourse.totalDuration > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-purple-500" />
                                        {currentCourse.totalDuration >= 60
                                            ? `${Math.round(currentCourse.totalDuration / 60)} hrs`
                                            : `${currentCourse.totalDuration} min`}
                                    </span>
                                )}
                            </div>

                            {tutor && (
                                <div className="mb-8 p-5 bg-white rounded-xl border border-gray-200">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">About the Instructor</h2>
                                    <div className="flex items-start gap-4">
                                        {/* Avatar — real image or initial */}
                                        <div 
                                            onClick={() => navigate(ROUTES.STUDENT_TUTOR_DETAIL.replace(':tutorId', tutor._id))}
                                            className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-purple-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition"
                                        >
                                            {tutor.profileImageURL || tutor.profileImage ? (
                                                <img
                                                    src={tutor.profileImageURL || tutor.profileImage}
                                                    alt={tutor.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.innerHTML = `<span class="text-white font-bold text-xl">${(tutor.name?.charAt(0) || 'T').toUpperCase()}</span>`;
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-white font-bold text-xl">
                                                    {tutor.name?.charAt(0)?.toUpperCase() || 'T'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p 
                                                onClick={() => navigate(ROUTES.STUDENT_TUTOR_DETAIL.replace(':tutorId', tutor._id))}
                                                className="font-bold text-gray-900 text-base cursor-pointer hover:text-purple-600 transition"
                                            >
                                                {tutor.name}
                                            </p>
                                            {tutor.tutorProfile?.subject && (
                                                <p className="text-purple-600 text-sm mb-2">{tutor.tutorProfile.subject}</p>
                                            )}

                                            {/* Stats row */}
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                                {tutor.totalCourses > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                                        {tutor.totalCourses} {tutor.totalCourses === 1 ? 'Course' : 'Courses'}
                                                    </span>
                                                )}
                                                {tutor.totalStudents > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4 text-purple-400" />
                                                        {tutor.totalStudents.toLocaleString()} {tutor.totalStudents === 1 ? 'Student' : 'Students'}
                                                    </span>
                                                )}
                                            </div>

                                            {tutor.tutorProfile?.bio && (
                                                <p className="text-gray-600 text-sm leading-relaxed">{tutor.tutorProfile.bio}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {lessons.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-bold text-gray-800 mb-3">Syllabus</h2>
                                    {(() => {
                                        const chapMap = {};
                                        lessons.forEach(l => {
                                            const key = l.chapter?.order ?? 1;
                                            if (!chapMap[key]) chapMap[key] = { order: key, title: l.chapter?.title ?? 'Chapter 1', lessons: [] };
                                            chapMap[key].lessons.push(l);
                                        });
                                        const chapters = Object.values(chapMap)
                                            .sort((a, b) => a.order - b.order)
                                            .map(ch => ({ ...ch, lessons: ch.lessons.sort((a, b) => a.order - b.order) }));

                                        return chapters.map(chapter => (
                                            <div key={chapter.order} className="mb-3 border border-gray-200 rounded-xl overflow-hidden">
                                                {/* Chapter header */}
                                                <div className="flex items-center gap-3 px-4 py-3 bg-purple-50">
                                                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-xs font-bold">{chapter.order}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800 text-sm">Chapter {chapter.order}: {chapter.title}</p>
                                                        <p className="text-xs text-gray-500">{chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                {/* Lessons in chapter */}
                                                <div className="divide-y divide-gray-100">
                                                    {chapter.lessons.map((lesson, idx) => (
                                                        <div 
                                                            key={lesson._id} 
                                                            onClick={() => {
                                                                if (currentCourse?.isEnrolled) {
                                                                    navigate(`/student/courses/${id}/learn`, { state: { lessonId: lesson._id } });
                                                                } else {
                                                                    setShowLockModal(true);
                                                                }
                                                            }}
                                                            className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition cursor-pointer"
                                                        >
                                                            <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5 bg-purple-100">
                                                                <PlayCircle className="w-4 h-4 text-purple-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-800">{idx + 1}. {lesson.title}</p>
                                                                {lesson.description && (
                                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{lesson.description}</p>
                                                                )}
                                                            </div>
                                                            {lesson.duration > 0 && (
                                                                <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{lesson.duration} min</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}

                            {/* Reviews section */}
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Student Feedback</h2>
                                
                                {summary && (
                                    <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-8">
                                        {/* Avg score block */}
                                        <div className="flex flex-col items-center justify-center text-center px-4">
                                            <span className="text-5xl font-black text-purple-700 leading-none mb-2">
                                                {summary.averageRating?.toFixed(1) || '0.0'}
                                            </span>
                                            <StarRating rating={summary.averageRating || 0} size={20} className="mb-2" />
                                            <span className="text-xs font-semibold text-gray-400">
                                                Course Rating ({summary.totalReviews || 0} reviews)
                                            </span>
                                        </div>

                                        {/* Progress Bars */}
                                        <div className="flex-1 w-full space-y-2.5">
                                            {[5, 4, 3, 2, 1].map(stars => {
                                                const count = summary.distribution?.[stars] || 0;
                                                const percent = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={stars} className="flex items-center gap-3 text-sm">
                                                        <span className="flex items-center gap-1 text-xs font-semibold text-purple-600 min-w-[36px]">
                                                            {stars} ★
                                                        </span>
                                                        <div className="flex-1 bg-gray-250/70 h-2.5 rounded-full overflow-hidden bg-gray-250">
                                                            <div 
                                                                className="bg-yellow-400 h-full rounded-full transition-all duration-500" 
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500 min-w-[32px] text-right">
                                                            {Math.round(percent)}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    {reviews.length > 0 ? (
                                        reviews.map(review => (
                                            <div key={review._id} className="p-5 bg-white rounded-xl border border-gray-150 shadow-sm space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {review.student?.profileImageURL || review.student?.profileImage ? (
                                                            <img
                                                                src={review.student.profileImageURL || review.student.profileImage}
                                                                alt={review.student.name}
                                                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <AvatarInitial name={review.student?.name || '?'} size="md" color="purple" />
                                                        )}
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-800">{review.student?.name || 'Anonymous Student'}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <StarRating rating={review.rating} size={12} />
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-gray-600 leading-relaxed pl-1">
                                                        {review.comment}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-400 text-sm">No reviews yet for this course</p>
                                        </div>
                                    )}

                                    {/* View more reviews */}
                                    {reviewsPage < reviewsTotalPages && (
                                        <div className="flex justify-center pt-4">
                                            <button
                                                onClick={handleLoadMore}
                                                disabled={reviewsLoading}
                                                className="px-6 py-2.5 border border-purple-600 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-50 transition disabled:opacity-50"
                                            >
                                                {reviewsLoading ? 'Loading...' : 'View more Reviews'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT — sticky course card */}
                        <div className="w-full lg:w-80 flex-shrink-0">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden lg:sticky lg:top-24">
                                <div className="w-full h-44 bg-gray-100 overflow-hidden">
                                    {currentCourse.thumbnailURL ? (
                                        <img src={currentCourse.thumbnailURL} alt={currentCourse.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-purple-300" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    {/* Price */}
                                    <div className="mb-4">
                                        {discountedPrice ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-gray-900">₹{discountedPrice}</span>
                                                <span className="text-base text-gray-400 line-through">₹{currentCourse.price}</span>
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    {currentCourse.offerPercentage}% off
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-900">
                                                {currentCourse.price === 0 ? 'Free' : `₹${currentCourse.price}`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    {currentCourse.isEnrolled ? (
                                        <button
                                            onClick={() => navigate(`/student/courses/${id}/learn`)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition mb-3"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Go to Course
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Enroll Now — goes directly to checkout */}
                                            <button
                                                onClick={handleEnrollNow}
                                                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                                            >
                                                Enroll Now
                                            </button>

                                            {/* Add to Cart */}
                                            <button
                                                onClick={inCart ? () => navigate(ROUTES.STUDENT_CART) : handleAddToCart}
                                                disabled={cartLoading}
                                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium border transition disabled:opacity-60 ${
                                                    inCart
                                                        ? 'bg-purple-50 border-purple-600 text-purple-600 hover:bg-purple-100'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                {cartLoading ? 'Adding...' : inCart ? 'Go to Cart' : 'Add to Cart'}
                                            </button>

                                            {/* Wishlist */}
                                            <button
                                                onClick={handleWishlist}
                                                disabled={wishlistLoading}
                                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium border transition disabled:opacity-60 ${
                                                    inWishlist
                                                        ? 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                                                {wishlistLoading ? '...' : inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                            </button>
                                        </div>
                                    )}

                                    <ul className="space-y-2 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                                        <li className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-gray-400" />
                                            {lessons.length} lessons
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            {currentCourse.enrolledCount || 0} students
                                        </li>
                                        {currentCourse.totalDuration > 0 && (
                                            <li className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {currentCourse.totalDuration >= 60
                                                    ? `${Math.round(currentCourse.totalDuration / 60)} hrs total`
                                                    : `${currentCourse.totalDuration} min total`}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {moreCourses.length > 0 && (
                    <div className="w-full px-5 py-8 bg-white border-t border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">More Courses Like This</h2>
                            <button onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)} className="text-sm text-purple-600 font-medium hover:underline">See all</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                            {moreCourses.map(course => (
                                <div key={course._id} onClick={() => navigate(`/student/courses/${course._id}`)}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden">
                                    <div className="w-full h-36 bg-gray-100 overflow-hidden">
                                        {course.thumbnailURL ? (
                                            <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-purple-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs text-purple-500 font-medium mb-0.5">{course.category}</p>
                                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{course.title}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{course.tutor?.name}</p>
                                        <span className="text-purple-600 font-bold text-sm">
                                            {course.price === 0 ? 'Free' : `₹${course.price}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Lesson Locked Modal */}
            {showLockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-105 transform transition-all scale-100 duration-300">
                        {/* Close button */}
                        <button 
                            onClick={() => setShowLockModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                        >
                            ✕
                        </button>
                        
                        {/* Info Icon & Title */}
                        <div className="flex flex-col items-center text-center mt-2">
                            <div className="w-16 h-16 rounded-full border-4 border-red-600 flex items-center justify-center mb-4">
                                <span className="text-red-600 text-4xl font-light font-serif">i</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🔒</span>
                                <h3 className="text-xl font-bold text-gray-900">Lesson Locked</h3>
                            </div>
                            <p className="text-sm text-gray-600 px-2 mb-6">
                                This lesson is locked. Purchase the course to unlock all {lessons.length} lessons.
                            </p>
                        </div>

                        {/* What you'll get box */}
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 mb-6">
                            <h4 className="font-semibold text-gray-800 text-sm mb-3">What you'll get:</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-500 font-bold">✓</span> Access to all {lessons.length} video lessons
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-500 font-bold">✓</span> Lifetime access to course content
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-500 font-bold">✓</span> Certificate of completion
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-500 font-bold">✓</span> Learn at your own pace
                                </li>
                            </ul>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowLockModal(false);
                                    handleEnrollNow();
                                }}
                                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-200"
                            >
                                Purchase Now
                            </button>
                            <button
                                onClick={() => setShowLockModal(false)}
                                className="flex-1 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition duration-200"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
