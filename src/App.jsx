import { useState, useRef } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import MessageInput from './components/MessageInput'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'

function App() {
    const [conversations, setConversations] = useState([
        { id: 1, title: '新對話', messages: [] }
    ])
    const [currentConversationId, setCurrentConversationId] = useState(1)
    const [selectedModel, setSelectedModel] = useState('openai/chatgpt-4o-latest')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const chatAreaRef = useRef(null)

    const addNewConversation = () => {
        const newId = conversations.length + 1
        setConversations([...conversations, { id: newId, title: '新對話', messages: [] }])
        setCurrentConversationId(newId)
        setIsSidebarOpen(false) // 在手機版新增對話後自動關閉側邊欄
    }

    const handleConversationSelect = (id) => {
        setCurrentConversationId(id)
        setIsSidebarOpen(false) // 在手機版選擇對話後自動關閉側邊欄
    }

    const sendMessage = async (message, useWeb, useRag) => {
        if (chatAreaRef.current) {
            await chatAreaRef.current.handleNewMessage(message, selectedModel, useWeb, useRag);
        }
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* 側邊欄遮罩 - 只在手機版顯示 */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* 側邊欄 */}
            <div
                className={classNames(
                    'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <Sidebar
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onConversationSelect={handleConversationSelect}
                    onNewConversation={addNewConversation}
                    selectedModel={selectedModel}
                    onModelSelect={setSelectedModel}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* 主要內容區 */}
            <div className="flex-1 flex flex-col relative">
                {/* 頂部導航欄 */}
                <header className="bg-white shadow-sm h-16 flex items-center px-4 fixed top-0 right-0 left-0 lg:left-64 z-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-semibold ml-2">Ausexticity AI</h1>
                </header>

                {/* 聊天區域容器 */}
                <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] mt-16 w-full mx-auto">
                    {/* 可滾動的聊天內容區 */}
                    <div className="flex-1 overflow-y-auto w-full">
                        <ChatArea ref={chatAreaRef} />
                    </div>

                    {/* 固定在底部的輸入框 */}
                    <div className="flex-shrink-0 w-full">
                        <MessageInput onSendMessage={sendMessage} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App 