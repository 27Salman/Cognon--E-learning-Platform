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
    if (platform === 'youtube') return `https://www.youtube.com/embed/${id}`;
    if (platform === 'vimeo') return `https://player.vimeo.com/video/${id}`;
    return null;
};

export default function VideoPlayer({ videoUrl }) {
    const parsed = parseVideoUrl(videoUrl);
    const embedUrl = parsed ? generateEmbedUrl(parsed.platform, parsed.id) : null;

    if (!embedUrl) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
                <p className="text-gray-400 text-sm">
                    {videoUrl ? 'Invalid video URL' : 'No video available for this lesson'}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
                src={embedUrl}
                title="Lesson Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}
