import React, { useEffect } from 'react'
import { getConversationDetailsApi, getConversationMessagesApi,postMessageApi } from '../../Apis/CreateConversation'
import { getSingleEntryApi } from '../../Apis/EntriesApi'
import { useAuth } from '../../Utils/AuthContext'
import { useParams } from 'react-router-dom'
import ChatArea from '../../Components/ChatArea/ChatArea'
const SingleTicketPage = () => {
  const {id: conversationId} = useParams();
  const {user} = useAuth();
  const currentUserId = user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const [conversationDetail,setConversationDetail] = React.useState(null);
  const [entryDetail,setEntryDetail] = React.useState(null);
  const [messages,setMessages] = React.useState({
    count: 0,
    next: null,
    previous: null,
    results: []
  });





const messageTo = conversationDetail?.participants.find(participant=>participant.id !== currentUserId)?.first_name || "Support Team";


  const fetchEntryDetails = async(entryId)=>{
    try{
      const response = await getSingleEntryApi(entryId);
      setEntryDetail(response.data);
    }catch(err){
      console.error(err);
    }
  }
     
  const fetchConversationDetails = async()=>{
    try{
      const response = await getConversationDetailsApi(conversationId);
      setConversationDetail(response.data);
      fetchEntryDetails(response.data.related_object_id);

    }catch(err){
      console.error(err);
    }
  }

  const fetchMessages = async()=>{
    try{
      const response = await getConversationMessagesApi(conversationId);
      setMessages(response.data);
    }catch(err){
      console.error(err);
    }
  }

console.log(messages);
  useEffect(() => {
    fetchConversationDetails();
    fetchMessages();
  },[])


  return (
    <div>
       <ChatArea  messages={messages} messageTo={messageTo} currentUserId={currentUserId} />
    </div>
  )
}

export default SingleTicketPage
