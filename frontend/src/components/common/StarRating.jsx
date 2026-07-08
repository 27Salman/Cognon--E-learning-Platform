import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
    rating = 0,
    maxStars = 5,
    interactive = false,
    onChange,
    size = 18,
    className = '',
}) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseEnter = (index) => {
        if (interactive) setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (interactive) setHoverRating(0);
    };

    const handleClick = (index) => {
        if (interactive && onChange) {
            onChange(index);
        }
    };

    const stars = [];
    for (let i = 1; i <= maxStars; i++) {
        const isHovered = hoverRating >= i;
        const isFilled = !interactive ? rating >= i : (hoverRating > 0 ? hoverRating >= i : rating >= i);
        
        let isHalf = false;
        if (!interactive && !isFilled && rating > i - 1 && rating < i) {
            isHalf = true;
        }

        stars.push(
            <span
                key={i}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(i)}
                className={`inline-block ${interactive ? 'cursor-pointer transform hover:scale-110 transition-transform duration-150' : ''}`}
                style={{ width: size, height: size }}
            >
                <div className="relative inline-block" style={{ width: size, height: size }}>
                    {/* Background grey star */}
                    <Star
                        size={size}
                        className="text-gray-300 fill-gray-100 absolute top-0 left-0"
                    />

                    {/* Half filled gold star overlay */}
                    {isHalf && (
                        <div className="overflow-hidden absolute top-0 left-0" style={{ width: '50%', zIndex: 1 }}>
                            <Star
                                size={size}
                                className="text-yellow-400 fill-yellow-400"
                            />
                        </div>
                    )}

                    {/* Fully filled gold star overlay */}
                    {isFilled && (
                        <Star
                            size={size}
                            className="text-yellow-400 fill-yellow-400 absolute top-0 left-0"
                            style={{ zIndex: 2 }}
                        />
                    )}
                </div>
            </span>
        );
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {stars}
        </div>
    );
}
