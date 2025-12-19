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
import {io} from "socket.io-client";

const socket=io("http://localhost:5000");

const MeetPage = () => {
  const { meetId } = useParams();
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [code,setCode]=useState("");
  const [language,setLanguage]=useState("cpp");
  const [input ,setInput]=useState("");
  const [output,setOutput]=useState("");
  const [loading,setLoading]=useState(false);
  const [showChat,setShowChat]=useState(false);

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

    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [meetId]);

  useEffect(()=>{
    if(!meetId) return;

    socket.emit("join-room",meetId);

    socket.on("code-update",(newCode)=>{
      if(newCode!==code){
        setCode(newCode);
      }
    });

    socket.on("input-update",(newInput)=>{
        setInput(newInput);
    });

    socket.on("output-update",(newOutput)=>{
        setOutput(newOutput);
    });

    return()=>{
      socket.off("code-update");
      socket.off("input-update");
      socket.off("output-update");
    }
  },[meetId]);

  const handleCodeChange=(newCode)=>{
    setCode(newCode);
    socket.emit("code-change",{meetId,code:newCode});
  }

  const handleRun=async()=>{
    try {
      setLoading(true);
      const res=await API.post("/piston/run",{
        language,
        code,
        stdin:input
      });

      const newOutput=res.data.stdout || res.data.stderr||"No output";

      setOutput(newOutput);

      socket.emit("output-change",{meetId,output:newOutput});

      
    } catch (error) {
      console.error("❌ Error running code:", error);
      const errOut="Error running code: " + error.message;
      setOutput(errOut);
      socket.emit("output-change",{meetId,output:errOut});
    }finally{
      setLoading(false);
    }
  }

  const handleLang=(e)=>{
    setLanguage(e.target.value);
  }

  const handleInputChange=(e)=>{
    setInput(e.target.value);
    socket.emit("input-change",{meetId,input:e.target.value});
  }

  if (!client || !channel) {
    return <div>Loading Meet...</div>;
  }

  if(loading){
    return <div>Running Code...</div>;
  }
  return (
    <div className="relative h-screen bg-gray-100 overflow-hidden">

      {!showChat && (
        <button onClick={()=> setShowChat(true)} className="absolute top-5 right-5 z-20 bg-blue-600 text-white px-6 py-2 rounded shadow-lg hover:bg-blue-700 transition">
          M
        </button>
      )}

    <div className={`h-full transition-all duration-300 ${showChat ? "blur-xs brightness-75 pointer-events-none" : ""}`}>

      <Split 
      className="flex h-full"
      sizes={[35,65]}
      minSize={250}
      gutterSize={6}
      direction="horizontal">
      

      <div className="bg-gray-200 flex items-center justify-center text-lg text-gray-600">
        Whiteboard Section td
      </div>

      {/* RIGHT PANEL - code editor*/}
      <div className="flex flex-col p-4 overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">
          coding area
        </h2>
        <div >
          <select className="border px-4 py-2 rounded"
          value={language}
          onChange={handleLang}>
            <option value="python">Python</option>
            <option value="cpp">Cpp</option>
            <option value="java">Java</option>
            <option value="javascript">Javascript</option>
          </select>

          <button onClick={handleRun}>
            Run Code
          </button>
        </div>

        <div className="flex-1 border rounded overflow-hidden mb-3">
          <Editor 
          height="100%"
          theme="vs-dark"
          value={code}
          language={language}
          onChange={handleCodeChange}/>

        </div>

        <div className="grid grid-cols-2 gap-3">
          <textarea className="border p-2 rounded h-32 text-sm"
          placeholder="enter input here"
          value={input}
          onChange={handleInputChange}/>

          <div className="border p-2 rounded h-22 bg-white overflow-auto text-sm whitespace-pre-wrap">
            {output || "output will be shown here"}
          </div>
        </div>
      </div>
          </Split>
      </div>
      <div className={`absolute top-0 right-0 h-full w-[40%] bg-white shadow-xl transition-transform duration-500 z-30 ${
          showChat ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="flex justify-between items-center p-3 border-b">
          <h3 className="font-bold text-lg">Chat</h3>
          <button
            onClick={() => setShowChat(false)}
            className="text-red-500 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto p-2">
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



 
