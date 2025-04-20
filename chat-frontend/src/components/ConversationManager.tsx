import React, { useState } from 'react';
import { Conversation } from '../types/message.tsx';
import { 
    createConversation, 
    updateConversation, 
    deleteConversation,
    archiveConversation,
    unarchiveConversation
} from '../api/api.ts';
import '../styles/ConversationManager.css';

interface ConversationManagerProps {
    userId: string | null;
    conversations: Conversation[];
    selectedConversationId: string | null;
    onConversationSelect: (id: string) => void;
    onConversationsChange: () => void;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({
    userId,
    conversations,
    selectedConversationId,
    onConversationSelect,
    onConversationsChange
}) => {
    const [newConversationName, setNewConversationName] = useState('');
    const [editingConversation, setEditingConversation] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const handleCreateConversation = async () => {
        if (!userId) return;
        
        try {
            const name = newConversationName.trim() || 'New Conversation';
            const newConversation = await createConversation(userId, name);
            setNewConversationName('');
            onConversationsChange();
            onConversationSelect(newConversation.id);
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    const handleUpdateConversation = async (id: string) => {
        try {
            await updateConversation(id, { name: editName });
            setEditingConversation(null);
            onConversationsChange();
        } catch (error) {
            console.error('Error updating conversation:', error);
        }
    };

    const handleDeleteConversation = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            try {
                await deleteConversation(id);
                onConversationsChange();
                if (selectedConversationId === id) {
                    // Select another conversation if available
                    const remainingConvs = conversations.filter(c => c.id !== id);
                    if (remainingConvs.length > 0) {
                        onConversationSelect(remainingConvs[0].id);
                    } else {
                        // Create a new conversation if none left
                        if (userId) {
                            const newConv = await createConversation(userId);
                            onConversationSelect(newConv.id);
                        }
                    }
                }
            } catch (error) {
                console.error('Error deleting conversation:', error);
            }
        }
    };

    const handleArchiveToggle = async (id: string, currentlyArchived: boolean) => {
        try {
            if (currentlyArchived) {
                await unarchiveConversation(id);
            } else {
                await archiveConversation(id);
            }
            onConversationsChange();
        } catch (error) {
            console.error('Error toggling archive status:', error);
        }
    };

    const filteredConversations = showArchived 
        ? conversations 
        : conversations.filter(c => !c.is_archived);

    return (
        <div className="conversation-manager">
            <div className="new-conversation">
                <button 
                    onClick={handleCreateConversation}
                    className="create-btn"
                    disabled={!userId}
                >
                    Create
                </button>
            </div>
            
            <div className="conversations-list">
                {filteredConversations.length === 0 ? (
                    <div className="no-conversations">No conversations found</div>
                ) : (
                    filteredConversations.map(conv => (
                        <div 
                            key={conv.id} 
                            className={`conversation-item ${selectedConversationId === conv.id ? 'selected' : ''} ${conv.is_archived ? 'archived' : ''}`}
                        >
                            {editingConversation === conv.id ? (
                                <div className="edit-conversation">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="edit-input"
                                        autoFocus
                                    />
                                    <button onClick={() => handleUpdateConversation(conv.id)}>Save</button>
                                    <button onClick={() => setEditingConversation(null)}>Cancel</button>
                                </div>
                            ) : (
                                <div className="conversation-content">
                                    <div 
                                        className="conversation-name"
                                        onClick={() => onConversationSelect(conv.id)}
                                    >
                                        {conv.name}
                                        {conv.is_archived && <span className="archived-badge">Archived</span>}
                                    </div>
                                    <div className="conversation-actions">
                                        <button 
                                            onClick={() => {
                                                setEditingConversation(conv.id);
                                                setEditName(conv.name);
                                            }}
                                            className="edit-btn"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleArchiveToggle(conv.id, !!conv.is_archived)}
                                            className="archive-btn"
                                        >
                                            {conv.is_archived ? 'Unarchive' : 'Archive'}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteConversation(conv.id)}
                                            className="delete-btn"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConversationManager;
