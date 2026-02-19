import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const WebRTCVideo = ({ meetId, currentUser }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidateQueue = useRef([]);

  const [connectionStatus, setConnectionStatus] = useState("waiting");
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);

  const buildPeer = useCallback((stream) => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
    }
    iceCandidateQueue.current = [];

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus("connected");
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", { meetId, candidate: event.candidate });
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      console.log("[WebRTC] state →", state);
      if (state === "connected") setConnectionStatus("connected");
      if (state === "failed") peer.restartIce();
      if (state === "disconnected" || state === "closed") {
        setConnectionStatus("disconnected");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setRemoteUser(null);
      }
    };

    peerRef.current = peer;
    return peer;
  }, [meetId]);

  const flushIceQueue = async (peer) => {
    while (iceCandidateQueue.current.length) {
      const c = iceCandidateQueue.current.shift();
      try { await peer.addIceCandidate(c); } catch (e) { console.warn("[ICE] flush err", e); }
    }
  };

  const sendOffer = async (peer) => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("webrtc-offer", { meetId, offer });
    } catch (err) {
      console.error("[WebRTC] sendOffer failed", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        buildPeer(stream);
        socket.emit("join-room", { meetId, userId: currentUser });
      } catch (err) {
        console.error("[Media] getUserMedia failed:", err);
      }
    };

    start();

    socket.on("user-joined", async ({ userId }) => {
      if (!mounted) return;
      setRemoteUser(userId);
      setConnectionStatus("connecting");
      const peer = buildPeer(localStreamRef.current);
      await sendOffer(peer);
    });

    socket.on("webrtc-offer", async (offer) => {
      if (!mounted) return;
      setConnectionStatus("connecting");
      const peer = peerRef.current;
      if (!peer) return;
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIceQueue(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("webrtc-answer", { meetId, answer });
    });

    socket.on("webrtc-answer", async (answer) => {
      if (!mounted) return;
      const peer = peerRef.current;
      if (!peer) return;
      if (peer.signalingState === "have-local-offer") {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        await flushIceQueue(peer);
      }
    });

    socket.on("webrtc-ice-candidate", async (candidate) => {
      if (!mounted) return;
      const peer = peerRef.current;
      if (!peer) return;
      const ice = new RTCIceCandidate(candidate);
      if (peer.remoteDescription?.type) {
        try { await peer.addIceCandidate(ice); }
        catch (e) { console.warn("[ICE] add error", e); }
      } else {
        iceCandidateQueue.current.push(ice);
      }
    });

    socket.on("user-left", () => {
      if (!mounted) return;
      setConnectionStatus("waiting");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setRemoteUser(null);
      if (localStreamRef.current) buildPeer(localStreamRef.current);
    });

    return () => {
      mounted = false;
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      socket.emit("leave-room", { meetId, userId: currentUser });
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
  }, [meetId, currentUser, buildPeer]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOff(!track.enabled); }
  };

  // Status config using only Tailwind colour names (resolved at render)
  const statusMap = {
    waiting:      { dotCls: "bg-amber-400",  textCls: "text-amber-400",  label: "Waiting…"      },
    connecting:   { dotCls: "bg-blue-400",   textCls: "text-blue-400",   label: "Connecting…"   },
    connected:    { dotCls: "bg-green-400",  textCls: "text-green-400",  label: "Live"           },
    disconnected: { dotCls: "bg-red-400",    textCls: "text-red-400",    label: "Disconnected"   },
  };
  const { dotCls, textCls, label } = statusMap[connectionStatus];

  return (
    <div className="flex flex-col flex-shrink-0 w-64 min-h-screen bg-slate-950 border-r border-white/5 px-3 py-4 gap-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-slate-500">
          Participants
        </span>
        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${textCls}`}>
          <span
            className={`w-2 h-2 rounded-full ${dotCls} ${
              connectionStatus !== "disconnected" ? "animate-pulse" : ""
            }`}
          />
          {label}
        </div>
      </div>

      {/* ── Local video ── */}
      <VideoSlot
        videoRef={localVideoRef}
        label="You"
        showOverlay={isCamOff}
        overlayContent={
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
            {currentUser?.[0]?.toUpperCase() ?? "Y"}
          </div>
        }
      />

      {/* ── Remote video ── */}
      <VideoSlot
        videoRef={remoteVideoRef}
        label={remoteUser ?? ""}
        showLabel={!!remoteUser}
        hideVideo={connectionStatus !== "connected"}
        showOverlay={connectionStatus !== "connected"}
        overlayContent={
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs relative z-10">
            {connectionStatus === "connecting" && (
              // Shimmer — inline keyframes via style since Tailwind doesn't ship shimmer
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,rgba(99,102,241,0.12),transparent)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.6s ease-in-out infinite",
                }}
              />
            )}
            <svg
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              className="opacity-30"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span className="text-center px-3">
              {connectionStatus === "connecting"
                ? "Connecting…"
                : connectionStatus === "disconnected"
                ? "Peer disconnected"
                : "Waiting for someone to join"}
            </span>
          </div>
        }
      />

      {/* ── Controls ── */}
      <div className="flex gap-2 mt-1">
        <CtrlBtn
          active={isMuted}
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          icon={isMuted ? "🔇" : "🎙️"}
        />
        <CtrlBtn
          active={isCamOff}
          onClick={toggleCam}
          title={isCamOff ? "Camera on" : "Camera off"}
          icon={isCamOff ? "📷" : "🎥"}
        />
      </div>

      {/* Shimmer keyframe — only way without a Tailwind plugin */}
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
};

/* ── Small sub-components ──────────────────────────────────────────────────── */

const VideoSlot = ({
  videoRef,
  label,
  showLabel = true,
  hideVideo = false,
  showOverlay = false,
  overlayContent,
}) => (
  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/[0.07] aspect-video">
    <video
      ref={videoRef}
      autoPlay
      muted={!showLabel} // local video is always muted
      playsInline
      className={`w-full h-full object-cover block ${hideVideo ? "hidden" : ""}`}
    />
    {showOverlay && (
      <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center">
        {overlayContent}
      </div>
    )}
    {showLabel && label && (
      <span className="absolute bottom-2 left-2 text-[10px] font-semibold tracking-wider uppercase bg-black/50 backdrop-blur text-slate-200 px-2 py-0.5 rounded-md">
        {label}
      </span>
    )}
    {/* Always show "You" label for local */}
    {!showLabel && label === "You" && (
      <span className="absolute bottom-2 left-2 text-[10px] font-semibold tracking-wider uppercase bg-black/50 backdrop-blur text-slate-200 px-2 py-0.5 rounded-md">
        You
      </span>
    )}
  </div>
);

const CtrlBtn = ({ active, onClick, title, icon }) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex-1 h-10 rounded-lg text-base flex items-center justify-center transition-colors duration-150 ${
      active
        ? "bg-red-500 text-white"
        : "bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
    }`}
  >
    {icon}
  </button>
);

export default WebRTCVideo;
