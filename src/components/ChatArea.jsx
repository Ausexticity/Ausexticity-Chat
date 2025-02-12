import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import ReactMarkdown from 'react-markdown'
import classNames from 'classnames'
import { chatAPI } from '../services/api'

const ChatArea = forwardRef((props, ref) => {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const messagesEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
    const scrollTimeoutRef = useRef(null)
    const isTypingRef = useRef(false)

    useImperativeHandle(ref, () => ({
        handleNewMessage
    }))

    const isNearBottom = () => {
        if (!chatContainerRef.current) return true
        const container = chatContainerRef.current
        const threshold = 100 // 距離底部 100px 內視為接近底部
        const distance = container.scrollHeight - container.scrollTop - container.clientHeight
        console.log('捲動距離檢查:', {
            scrollHeight: container.scrollHeight,
            scrollTop: container.scrollTop,
            clientHeight: container.clientHeight,
            distance: distance,
            isNear: distance < threshold
        })
        return distance < threshold
    }

    const scrollToBottom = () => {
        // 如果正在輸入中，取消之前的捲動計時器
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
        }

        // 設置新的捲動計時器
        scrollTimeoutRef.current = setTimeout(() => {
            if (chatContainerRef.current && shouldAutoScroll) {
                const container = chatContainerRef.current
                const scrollHeight = container.scrollHeight
                container.scrollTo({
                    top: scrollHeight,
                    behavior: isTypingRef.current ? 'auto' : 'smooth'
                })
            }
            scrollTimeoutRef.current = null
        }, 100)
    }

    // 監聽捲動事件
    useEffect(() => {
        const container = chatContainerRef.current
        if (!container) return

        const handleScroll = () => {
            const shouldScroll = isNearBottom()
            console.log('捲動事件觸發:', { shouldScroll })
            setShouldAutoScroll(shouldScroll)
        }

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [])

    // 分離聊天歷史載入的 useEffect
    useEffect(() => {
        if (!isInitialized) {
            loadChatHistory()
            setIsInitialized(true)
        }
    }, [isInitialized])

    // 監聽訊息變化的 useEffect
    useEffect(() => {
        if (messages.length > 0) {
            console.log('訊息更新觸發捲動:', {
                messagesCount: messages.length,
                lastMessage: messages[messages.length - 1]
            })
            requestAnimationFrame(() => {
                scrollToBottom()
            })
        }
    }, [messages])

    // 監聽狀態訊息變化的 useEffect
    useEffect(() => {
        console.log('狀態訊息更新:', {
            statusMessage,
            shouldAutoScroll
        })
        if (statusMessage && shouldAutoScroll) {
            requestAnimationFrame(() => {
                scrollToBottom()
            })
        }
    }, [statusMessage])

    const loadChatHistory = async () => {
        try {
            const history = await chatAPI.getChatHistory()
            if (history.messages) {
                console.log('載入歷史訊息:', {
                    messageCount: history.messages.length
                })
                setMessages(history.messages.map((msg, index) => ({
                    id: index,
                    content: msg.message,
                    sender: msg.is_bot ? 'ai' : 'user'
                })))
                requestAnimationFrame(() => {
                    console.log('歷史訊息載入後嘗試捲動')
                    scrollToBottom()
                })
            }
        } catch (error) {
            console.error('載入聊天歷史失敗:', error)
        }
    }

    const handleNewMessage = async (message, model, useWeb, useRag) => {
        const newMessage = {
            id: messages.length,
            content: message,
            sender: 'user'
        }

        setMessages(prev => [...prev, newMessage])
        setShouldAutoScroll(true)

        // 使用 requestAnimationFrame 確保 DOM 已更新
        requestAnimationFrame(() => {
            scrollToBottom()
        })

        // 保存用戶訊息
        await chatAPI.saveChatHistory(message, false)

        // 添加 AI 的載入訊息
        const loadingMessage = {
            id: messages.length + 1,
            content: '',
            sender: 'ai',
            loading: true  // 初始設為 true
        }
        setMessages(prev => [...prev, loadingMessage])
        setIsLoading(true)

        try {
            // 從 localStorage 獲取 user_id
            const userId = localStorage.getItem('userId')
            if (!userId) {
                throw new Error('未找到用戶ID')
            }

            const eventSource = await chatAPI.startChatStream(
                message,
                userId,
                model,
                useWeb,
                useRag
            )

            let fullResponse = ''
            let isFirstChunk = true

            // 使用 addEventListener 監聽消息
            eventSource.addEventListener('message', function (event) {
                try {
                    if (event.data) {
                        // 檢查是否為狀態訊息
                        if (event.data.startsWith('data:')) {
                            const statusText = event.data.replace('data:', '').trim()

                            if (statusText) {
                                setStatusMessage(statusText)
                                return
                            }
                        } else {
                            const newChunk = event.data
                            fullResponse += newChunk
                            setStatusMessage('')
                            isTypingRef.current = true

                            // 即時更新顯示，實現打字機效果
                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastMessage = newMessages[newMessages.length - 1]
                                if (lastMessage && lastMessage.sender === 'ai') {
                                    if (isFirstChunk) {
                                        lastMessage.loading = false
                                        isFirstChunk = false
                                    }
                                    lastMessage.content = fullResponse
                                }
                                return newMessages
                            })

                            // 只在接近底部時才觸發捲動
                            if (shouldAutoScroll) {
                                scrollToBottom()
                            }
                        }
                    }
                } catch (error) {
                    console.error('處理SSE消息時出錯:', error)
                }
            })

            // 監聽結束事件
            eventSource.addEventListener('end', function (event) {
                eventSource.close()
                setIsLoading(false)
                isTypingRef.current = false

                // 確保最後一次更新包含完整的回應
                setMessages(prev => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage && lastMessage.sender === 'ai') {
                        lastMessage.loading = false
                        lastMessage.content = fullResponse
                    }
                    return newMessages
                })

                // 回應結束時執行一次最終捲動
                if (shouldAutoScroll) {
                    setTimeout(() => {
                        scrollToBottom()
                    }, 100)
                }

                // 保存完整的 AI 回應
                if (fullResponse) {
                    chatAPI.saveChatHistory(fullResponse, true)
                }
            })

            // 監聽錯誤
            eventSource.addEventListener('error', function (event) {
                console.error('SSE錯誤:', event)
                eventSource.close()
                setIsLoading(false)

                // 如果有部分回應，確保顯示
                if (fullResponse) {
                    setMessages(prev => {
                        const newMessages = [...prev]
                        const lastMessage = newMessages[newMessages.length - 1]
                        if (lastMessage && lastMessage.sender === 'ai') {
                            lastMessage.loading = false
                            lastMessage.content = fullResponse
                        }
                        return newMessages
                    })
                    chatAPI.saveChatHistory(fullResponse, true)
                }
            })

        } catch (error) {
            console.error('聊天請求失敗:', error)
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full h-full pl-4 overflow-hidden flex flex-col">
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-4 pb-4 pt-4 pr-4"
                style={{ scrollBehavior: 'smooth' }}
                onScroll={(e) => {
                    console.log('容器捲動:', {
                        scrollTop: e.currentTarget.scrollTop,
                        scrollHeight: e.currentTarget.scrollHeight,
                        clientHeight: e.currentTarget.clientHeight,
                        距離底部: e.currentTarget.scrollHeight - e.currentTarget.scrollTop - e.currentTarget.clientHeight
                    })
                }}
            >
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={classNames(
                            'flex w-full',
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        <div
                            className={classNames(
                                'p-3 rounded-lg shadow-sm',
                                message.sender === 'user'
                                    ? 'bg-primary-500 text-white max-w-[80%] lg:max-w-[60%]'
                                    : 'bg-white text-gray-800 max-w-[80%] lg:max-w-[60%]'
                            )}
                        >
                            {message.loading ? statusMessage ?
                                (
                                    <div className="flex w-full justify-start">
                                        <div className="bg-gray-100 text-gray-600 p-2 rounded-lg text-sm flex items-center space-x-2">
                                            <span>{statusMessage}</span>
                                            <div className="flex space-x-1">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ) :
                                (
                                    <div className="flex space-x-2 justify-center">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                ) : (
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div ref={messagesEndRef} />
        </div>
    )
})

export default ChatArea 