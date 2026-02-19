import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StreamChat } from "stream-chat";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import API from "../lib/axios";
import { io } from "socket.io-client";
import WhiteBoard from "../components/WhiteBoard";
import WebRTCVideo from "../components/WebRTCVideo";
import { useAuthStore } from "../store/useAuthStore";

const socket = io("http://localhost:5000");

const MeetPage = () => {
  const { meetId } = useParams();
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { authUser } = useAuthStore();

  useEffect(() => {
    let chatClient;
    const setupChat = async () => {
      try {
        const res = await API.post("/meet/join", { meetId });
        const { apiKey, token, user } = res.data.stream;
        chatClient = StreamChat.getInstance(apiKey);
        await chatClient.connectUser(user, token);
        const chatChannel = chatClient.channel("messaging", meetId);
        await chatChannel.watch();
        setClient(chatClient);
        setChannel(chatChannel);
      } catch (error) {
        console.error("Error setting up chat:", error);
      }
    };
    setupChat();
    return () => { if (chatClient) chatClient.disconnectUser(); };
  }, [meetId]);

  useEffect(() => {
    if (!meetId) return;
    socket.emit("join-room", { meetId, userId: authUser?.username });
    socket.on("code-update", (newCode) => setCode(newCode));
    socket.on("input-update", (newInput) => setInput(newInput));
    socket.on("output-update", (newOutput) => setOutput(newOutput));
    return () => {
      socket.off("code-update");
      socket.off("input-update");
      socket.off("output-update");
    };
  }, [meetId]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("code-change", { meetId, code: newCode });
  };

  const handleRun = async () => {
    try {
      setLoading(true);
      const res = await API.post("/piston/run", { language, code, stdin: input });
      const newOutput = res.data.stdout || res.data.stderr || "No output";
      setOutput(newOutput);
      socket.emit("output-change", { meetId, output: newOutput });
    } catch (error) {
      const errOut = "Error running code: " + error.message;
      setOutput(errOut);
      socket.emit("output-change", { meetId, output: errOut });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit("input-change", { meetId, input: e.target.value });
  };

  if (!client || !channel) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400 text-sm">
        Connecting to meet…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* ── LEFT: WebRTC sidebar ─────────────────────────────────────────── */}
      <WebRTCVideo meetId={meetId} currentUser={authUser?.username} />

      {/* ── CENTER: main content ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden relative">

        {/* Chat toggle button */}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
          >
            M
          </button>
        )}

        {/* Dimmed wrapper when chat open */}
        <div
          className={`flex-1 overflow-hidden transition-all duration-300 ${
            showChat ? "brightness-75 pointer-events-none" : ""
          }`}
        >
          <Split
            className="flex h-full"
            sizes={[50, 50]}
            minSize={250}
            gutterSize={6}
            direction="horizontal"
          >
            {/* ── Whiteboard panel ── */}
            <div className="flex flex-col p-4 overflow-hidden h-full">
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
                Whiteboard
              </h2>
              <div className="flex-1 overflow-hidden rounded-lg border border-slate-200">
                <WhiteBoard meetId={meetId} />
              </div>
            </div>

            {/* ── Code editor panel ── */}
            <div className="flex flex-col p-4 overflow-hidden h-full">
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
                Code Editor
              </h2>

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>

                <button
                  onClick={handleRun}
                  disabled={loading}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-colors ${
                    loading
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 cursor-pointer"
                  }`}
                >
                  {loading ? "Running…" : "▶ Run"}
                </button>
              </div>

              {/* Monaco editor */}
              <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 mb-2">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  value={code}
                  language={language}
                  onChange={handleCodeChange}
                />
              </div>

              {/* Input / Output */}
              <div className="grid grid-cols-2 gap-2 h-28">
                <textarea
                  className="border border-slate-200 rounded-lg p-2 text-xs resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="stdin (input)"
                  value={input}
                  onChange={handleInputChange}
                />
                <div
                  className={`border border-slate-200 rounded-lg p-2 text-xs font-mono bg-slate-50 overflow-auto whitespace-pre-wrap ${
                    output ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {output || "output will appear here"}
                </div>
              </div>
            </div>
          </Split>
        </div>
      </div>

      {/* ── RIGHT: Chat drawer ───────────────────────────────────────────── */}
      <div
        className={`absolute top-0 right-0 h-full w-[38%] bg-white shadow-2xl flex flex-col z-30 transition-transform duration-300 ease-in-out ${
          showChat ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-800">Chat</h3>
          <button
            onClick={() => setShowChat(false)}
            className="text-red-500 hover:text-red-600 text-lg font-bold leading-none transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Chat client={client} theme="messaging light">
            <Channel channel={channel}>
              <Window>
                <ChannelHeader title="Chat" />
                <MessageList />
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          </Chat>
        </div>
      </div>

    </div>
  );
};

export default MeetPage;
