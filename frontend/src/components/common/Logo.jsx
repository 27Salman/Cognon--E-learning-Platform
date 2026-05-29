export default function Logo({ size = 40, className = '' }) {
    return (
        <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ width: size, height: size }}
        >
            <path 
                d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" 
                fill="none" 
                stroke="#7c3aed" 
                strokeWidth="3"
            />
            <path 
                d="M35 40 L50 48 L65 40 L65 55 L50 63 L35 55 Z" 
                fill="#7c3aed"
            />
            <path 
                d="M35 40 L35 55 L50 63 L50 48" 
                fill="#6d28d9"
            />
            <path 
                d="M65 40 L65 55 L50 63 L50 48" 
                fill="#8b5cf6"
            />
        </svg>
    );
}
