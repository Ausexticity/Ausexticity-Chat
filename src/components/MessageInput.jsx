import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, GlobeAltIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

// 定義全局樣式
const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #E5E7EB;
        border-radius: 9999px;
        border: 2px solid transparent;
        background-clip: content-box;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #D1D5DB;
    }
    
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #E5E7EB transparent;
    }
`;

// 創建樣式標籤
const styleSheet = document.createElement('style');
styleSheet.textContent = scrollbarStyles;
document.head.appendChild(styleSheet);

export default function MessageInput({ onSendMessage }) {
    const [message, setMessage] = useState('')
    const [useWeb, setUseWeb] = useState(false)
    const [useRag, setUseRag] = useState(false)
    const textareaRef = useRef(null)
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024)

    // 監聽螢幕尺寸變化
    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 1024)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const resetTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = isLargeScreen ? '58px' : '50px'
        }
    }

    const handleTextareaInput = (e) => {
        const textarea = e.target
        const baseHeight = isLargeScreen ? '58px' : '50px'
        textarea.style.height = baseHeight
        const newHeight = Math.min(textarea.scrollHeight, 200)
        textarea.style.height = newHeight + 'px'
    }

    // 監聽螢幕尺寸變化時重置高度
    useEffect(() => {
        resetTextareaHeight()
    }, [isLargeScreen])

    // 監聽 message 變化，當清空時重置高度
    useEffect(() => {
        if (!message) {
            resetTextareaHeight()
        }
    }, [message, isLargeScreen])

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message.trim(), useWeb, useRag);
            setMessage('');
            resetTextareaHeight();
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white p-3 lg:p-4 w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 lg:gap-4 w-full">
                {/* 功能切換按鈕 */}
                <div className="flex flex-wrap gap-2 lg:gap-4">
                    <button
                        type="button"
                        onClick={() => setUseWeb(!useWeb)}
                        className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm ${useWeb ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <GlobeAltIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                        網路搜尋
                    </button>
                    <button
                        type="button"
                        onClick={() => setUseRag(!useRag)}
                        className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm ${useRag ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <DocumentTextIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                        文件庫查詢
                    </button>
                </div>

                {/* 訊息輸入區 */}
                <div className="flex gap-2 lg:gap-4 w-full">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value)
                            handleTextareaInput(e)
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="輸入訊息..."
                        className="flex-1 resize-none rounded-lg border border-gray-300 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-[50px] lg:h-[60px] min-h-[50px] max-h-[200px] leading-5 lg:leading-6 overflow-x-hidden custom-scrollbar py-[14px] px-3 lg:py-[16px] lg:px-4"
                        style={{
                            overflowY: message.split('\n').length > 1 ? 'scroll' : 'hidden'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="flex-shrink-0 flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-lg bg-primary-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
                    >
                        <PaperAirplaneIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                    </button>
                </div>
            </form>
        </div>
    )
} 