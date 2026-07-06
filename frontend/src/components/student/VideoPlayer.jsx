import { useState } from 'react';
import { Play } from 'lucide-react';

const parseVideoUrl = (url) => {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };

    return null;
};

const generateEmbedUrl = (platform, id) => {
    if (platform === 'youtube') return `https://www.youtube.com/embed/${id}?autoplay=1`;
    if (platform === 'vimeo') return `https://player.vimeo.com/video/${id}?autoplay=1`;
    return null;
};

const getThumbnailUrl = (platform, id) => {
    if (platform === 'youtube') return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    return null;
};

export default function VideoPlayer({ videoUrl, onPlay }) {
    const [playing, setPlaying] = useState(false);

    const parsed = parseVideoUrl(videoUrl);
    const embedUrl = parsed ? generateEmbedUrl(parsed.platform, parsed.id) : null;
    const thumbnail = parsed ? getThumbnailUrl(parsed.platform, parsed.id) : null;

    if (!embedUrl) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
                <p className="text-gray-400 text-sm">
                    {videoUrl ? 'Invalid video URL' : 'No video available for this lesson'}
                </p>
            </div>
        );
    }

    const handlePlay = () => {
        setPlaying(true);
        if (onPlay) onPlay();
    };

    return (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black relative">
            {playing ? (
                <iframe
                    src={embedUrl}
                    title="Lesson Video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <button
                    onClick={handlePlay}
                    className="w-full h-full flex items-center justify-center bg-black group"
                    aria-label="Play video"
                >
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt="Video thumbnail"
                            className="absolute inset-0 w-full h-full object-cover opacity-70"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gray-900" />
                    )}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                        <Play className="w-7 h-7 text-purple-700 ml-1" fill="currentColor" />
                    </div>
                </button>
            )}
        </div>
    );
}
