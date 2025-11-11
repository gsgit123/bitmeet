import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StreamChat } from "stream-chat";
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

const MeetPage = () => {
  const { meetId } = useParams();
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);

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

  if (!client || !channel) {
    return <div>Loading Meet...</div>;
  }

  return (
    <Chat client={client} theme="messaging light">
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};

export default MeetPage;
