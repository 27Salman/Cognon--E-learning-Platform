import { useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export default function VideoCallModal({ roomId, serverSecret, appId, userId, userName, onClose }) {
    const initialized = useRef(false);
    const myMeeting = async (element) => {
        if (!element || !roomId || !serverSecret || !appId) {
            return;
        }
        
        if (initialized.current) return;
        initialized.current = true;

        try {
            console.log('[ZegoCloud] Initializing for room:', roomId);
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                parseInt(appId, 10),
                serverSecret,
                roomId,
                String(userId),
                userName || 'User'
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            
            zp.joinRoom({
                container: element,
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                showScreenSharingButton: true,
                showUserList: false,
                showRoomTimer: true,
                showPreJoinView: true,
                onLeaveRoom: () => {
                    onClose();
                },
            });
        } catch (err) {
            console.error('[ZegoCloud] Error during init:', err);
            initialized.current = false;
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#1c1f2e]">
            {/* The Zego container */}
            <div ref={myMeeting} className="w-full h-full" />
        </div>
    );
}
