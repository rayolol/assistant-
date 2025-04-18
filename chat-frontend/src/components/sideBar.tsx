import React, { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../types/UserStore.tsx';
import { fetchConversations } from '../api/api.ts';

const SideBar = () => {

    const { user, conversation_id, setConversationId } = useUserStore();
    const [conversations, setConversations] = useState([]);

    

}

export default SideBar;
