const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
import { authService } from './auth';

export const chatAPI = {
    // 開始新的聊天串流
    startChatStream: async (query, user_id, model = "openai/chatgpt-4o-latest", webSearch = false, rag = false) => {
        const idToken = await authService.getIdToken();
        const eventSource = new EventSource(
            `${API_BASE_URL}/chat?` + new URLSearchParams({
                query,
                user_id,
                model,
                web_search: webSearch,
                rag,
                token: idToken
            })
        );
        return eventSource;
    },

    // 保存聊天歷史
    saveChatHistory: async (message, isBot) => {
        const idToken = await authService.getIdToken();
        const response = await fetch(`${API_BASE_URL}/chat/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                message,
                is_bot: isBot,
                timestamp: new Date().toISOString()
            })
        });
        return response.json();
    },

    // 獲取聊天歷史
    getChatHistory: async () => {
        const idToken = await authService.getIdToken();
        const response = await fetch(`${API_BASE_URL}/chat/history`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        return response.json();
    }
}; 