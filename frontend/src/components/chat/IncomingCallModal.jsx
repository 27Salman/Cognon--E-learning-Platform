import { useEffect, useRef } from "react";
import { Video, PhoneOff, Phone } from "lucide-react";

export default function IncomingCallModal({ callData, onAccept, onReject }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    let oscillator = null;
    let gainNode = null;
    let interval = null;

    const ring = () => {
      oscillator = ctx.createOscillator();
      gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      oscillator.start();
      setTimeout(() => {
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.5);
        oscillator.stop(ctx.currentTime + 0.5);
      }, 600);
    };

    ring();
    interval = setInterval(ring, 1500);

    return () => {
      clearInterval(interval);
      try {
        ctx.close();
      } catch (_) {}
    };
  }, []);

  if (!callData) return null;

  return (
    /* Backdrop with blur effect */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-80 overflow-hidden animate-[slideUp_0.3s_ease-out]">
        {/* Purple gradient header */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-6 pt-8 pb-6 flex flex-col items-center gap-3">
          {/* Pulsing ring around avatar */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-white/20 animate-ping" />
            <div className="absolute w-20 h-20 rounded-full bg-white/30" />
            {callData.callerAvatar ? (
              <img
                src={callData.callerAvatar}
                alt={callData.callerName}
                className="relative w-16 h-16 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center text-purple-600 font-bold text-2xl border-2 border-white">
                {callData.callerName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          <div className="text-center text-white mt-2">
            <p className="text-xs font-medium uppercase tracking-widest text-purple-200 mb-1">
              Incoming Video Call
            </p>
            <h2 className="text-xl font-bold">{callData.callerName}</h2>
            <p className="text-sm text-purple-200 mt-0.5">Your Tutor</p>
          </div>

          {/* Animated dots to show the call is active */}
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/70 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        {/* Accept / Decline buttons */}
        <div className="flex items-center justify-around px-6 py-5 bg-gray-50">
          {/* Decline */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-100 hover:bg-red-500 flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-md">
              <PhoneOff className="w-6 h-6 text-red-500 group-hover:text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 hover:bg-green-500 flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-md">
              <Video className="w-6 h-6 text-green-500 group-hover:text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
