import { useEffect, useState } from 'react';
import './Loader.css';

export default function Loader({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 2500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className="loader-container">
            <div className="loader-content">
                <div className="logo-wrapper">
                    <div className="logo-icon">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" 
                                  fill="none" 
                                  stroke="#7c3aed" 
                                  strokeWidth="3"
                                  className="logo-shape"/>
                            <path d="M35 40 L50 48 L65 40 L65 55 L50 63 L35 55 Z" 
                                  fill="#7c3aed"
                                  className="logo-book"/>
                            <path d="M35 40 L35 55 L50 63 L50 48" 
                                  fill="#6d28d9"
                                  className="logo-book-side"/>
                            <path d="M65 40 L65 55 L50 63 L50 48" 
                                  fill="#8b5cf6"
                                  className="logo-book-side"/>
                        </svg>
                    </div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring ring-delayed"></div>
                </div>
                <h1 className="brand-name">Cognon</h1>
                <p className="tagline">E-Learning Platform</p>
                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>
        </div>
    );
}
