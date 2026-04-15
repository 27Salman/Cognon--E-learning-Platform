import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';

const MIN_SIZE = 50;
const CONTAINER_W = 560;
const CONTAINER_H = 360;

export default function ImageCropModal({ imageSrc, aspectRatio = 16 / 9, onCrop, onClose }) {
    const canvasRef = useRef(null);
    const dragRef = useRef(null);

    const [imgRect, setImgRect] = useState(null);
    const [imgNatural, setImgNatural] = useState(null);
    const [crop, setCrop] = useState(null);

    const computeLayout = useCallback((natW, natH) => {
        const scale = Math.min(CONTAINER_W / natW, CONTAINER_H / natH);
        const rW = Math.floor(natW * scale);
        const rH = Math.floor(natH * scale);
        const rX = Math.floor((CONTAINER_W - rW) / 2);
        const rY = Math.floor((CONTAINER_H - rH) / 2);
        const rect = { x: rX, y: rY, w: rW, h: rH };

        const cW = Math.floor(rW * 0.85);
        const cH = Math.floor(cW / aspectRatio);
        const cX = rX + Math.floor((rW - cW) / 2);
        const cY = rY + Math.floor((rH - cH) / 2);

        setImgNatural({ w: natW, h: natH });
        setImgRect(rect);
        setCrop({ x: cX, y: cY, w: cW, h: cH });
    }, [aspectRatio]);

    const handleImgLoad = useCallback((e) => {
        computeLayout(e.target.naturalWidth, e.target.naturalHeight);
    }, [computeLayout]);

    const clampCrop = useCallback((c, rect) => {
        if (!rect) return c;
        let { x, y, w, h } = c;
        w = Math.max(MIN_SIZE, Math.min(w, rect.w));
        h = Math.round(w / aspectRatio);
        if (h > rect.h) {
            h = rect.h;
            w = Math.round(h * aspectRatio);
        }
        x = Math.max(rect.x, Math.min(x, rect.x + rect.w - w));
        y = Math.max(rect.y, Math.min(y, rect.y + rect.h - h));
        return { x, y, w, h };
    }, [aspectRatio]);

    const getEventPos = (e) => {
        const client = e.touches ? e.touches[0] : e;
        return { x: client.clientX, y: client.clientY };
    };

    const onHandleMouseDown = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = getEventPos(e);
        dragRef.current = { type, startX: pos.x, startY: pos.y, startCrop: { ...crop } };
    };

    const onMouseMove = useCallback((e) => {
        if (!dragRef.current || !crop || !imgRect) return;
        const { type, startX, startY, startCrop } = dragRef.current;
        const pos = getEventPos(e);
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        let next = { ...startCrop };

        if (type === 'move') {
            next.x = startCrop.x + dx;
            next.y = startCrop.y + dy;
        } else if (type === 'se') {
            next.w = startCrop.w + dx;
        } else if (type === 'sw') {
            const newW = startCrop.w - dx;
            next.x = startCrop.x + startCrop.w - newW;
            next.w = newW;
        } else if (type === 'ne') {
            const newW = startCrop.w + dx;
            const newH = newW / aspectRatio;
            next.w = newW;
            next.h = newH;
            next.y = startCrop.y + startCrop.h - newH;
        } else if (type === 'nw') {
            const newW = startCrop.w - dx;
            const newH = newW / aspectRatio;
            next.x = startCrop.x + startCrop.w - newW;
            next.y = startCrop.y + startCrop.h - newH;
            next.w = newW;
            next.h = newH;
        }

        setCrop(clampCrop(next, imgRect));
    }, [crop, imgRect, aspectRatio, clampCrop]);

    const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const handleApplyCrop = () => {
        if (!crop || !imgRect || !imgNatural) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const scaleX = imgNatural.w / imgRect.w;
        const scaleY = imgNatural.h / imgRect.h;

        const sx = (crop.x - imgRect.x) * scaleX;
        const sy = (crop.y - imgRect.y) * scaleY;
        const sw = crop.w * scaleX;
        const sh = crop.h * scaleY;

        canvas.width = Math.round(sw);
        canvas.height = Math.round(sh);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (!blob) return;
                const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                onCrop(file, URL.createObjectURL(blob));
            }, 'image/jpeg', 0.92);
        };
        img.src = imageSrc;
    };

    const HANDLE = 10; // handle size px

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ width: CONTAINER_W + 40 }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">Crop Image</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Drag the box to move · Drag corners to resize</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Crop stage */}
                <div
                    className="relative bg-gray-900 overflow-hidden select-none mx-5 my-4 rounded-lg"
                    style={{ width: CONTAINER_W, height: CONTAINER_H }}
                >
                    {/* Image */}
                    {imgRect && (
                        <img
                            src={imageSrc}
                            onLoad={handleImgLoad}
                            draggable={false}
                            className="absolute pointer-events-none"
                            style={{
                                left: imgRect.x,
                                top: imgRect.y,
                                width: imgRect.w,
                                height: imgRect.h,
                            }}
                            alt="source"
                        />
                    )}
                    {/* Preload to trigger onLoad */}
                    {!imgRect && (
                        <img
                            src={imageSrc}
                            onLoad={handleImgLoad}
                            className="opacity-0 absolute pointer-events-none"
                            alt=""
                        />
                    )}

                    {/* Overlays + crop box */}
                    {crop && imgRect && (
                        <>
                            {/* Dark overlays */}
                            <div className="absolute bg-black/55 pointer-events-none"
                                style={{ left: imgRect.x, top: imgRect.y, width: imgRect.w, height: crop.y - imgRect.y }} />
                            <div className="absolute bg-black/55 pointer-events-none"
                                style={{ left: imgRect.x, top: crop.y + crop.h, width: imgRect.w, height: (imgRect.y + imgRect.h) - (crop.y + crop.h) }} />
                            <div className="absolute bg-black/55 pointer-events-none"
                                style={{ left: imgRect.x, top: crop.y, width: crop.x - imgRect.x, height: crop.h }} />
                            <div className="absolute bg-black/55 pointer-events-none"
                                style={{ left: crop.x + crop.w, top: crop.y, width: (imgRect.x + imgRect.w) - (crop.x + crop.w), height: crop.h }} />

                            {/* Crop box */}
                            <div
                                className="absolute border-2 border-white cursor-move"
                                style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                                onMouseDown={e => onHandleMouseDown(e, 'move')}
                            >
                                {/* Rule-of-thirds */}
                                <div className="absolute inset-0 pointer-events-none" style={{
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
                                    backgroundSize: '33.33% 33.33%'
                                }} />
                            </div>

                            {/* Corner handles — rendered outside crop div to avoid cursor issues */}
                            {[
                                { type: 'nw', left: crop.x - HANDLE / 2, top: crop.y - HANDLE / 2, cursor: 'nw-resize' },
                                { type: 'ne', left: crop.x + crop.w - HANDLE / 2, top: crop.y - HANDLE / 2, cursor: 'ne-resize' },
                                { type: 'sw', left: crop.x - HANDLE / 2, top: crop.y + crop.h - HANDLE / 2, cursor: 'sw-resize' },
                                { type: 'se', left: crop.x + crop.w - HANDLE / 2, top: crop.y + crop.h - HANDLE / 2, cursor: 'se-resize' },
                            ].map(({ type, left, top, cursor }) => (
                                <div
                                    key={type}
                                    className="absolute bg-white border-2 border-purple-600 rounded-sm z-10"
                                    style={{ left, top, width: HANDLE, height: HANDLE, cursor }}
                                    onMouseDown={e => onHandleMouseDown(e, type)}
                                />
                            ))}
                        </>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Footer */}
                <div className="px-5 pb-4 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleApplyCrop} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                        <Check className="w-4 h-4" /> Apply Crop
                    </button>
                </div>
            </div>
        </div>
    );
}
