export default function ProgressBar({ progress = 0, size = 'medium' }) {
    const heights = { small: 'h-1.5', medium: 'h-2.5', large: 'h-4' };
    const isComplete = progress >= 100;

    return (
        <div className="w-full">
            <div className={`w-full bg-gray-200 rounded-full ${heights[size]}`}>
                <div
                    className={`${heights[size]} rounded-full transition-all duration-300 ${
                        isComplete ? 'bg-green-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>
            <p className={`mt-1 font-medium ${isComplete ? 'text-green-600' : 'text-purple-600'} ${
                size === 'small' ? 'text-xs' : 'text-sm'
            }`}>
                {progress}%
            </p>
        </div>
    );
}
