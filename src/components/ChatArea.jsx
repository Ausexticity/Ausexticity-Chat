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
        const threshold = 100
        const distance = container.scrollHeight - container.scrollTop - container.clientHeight
        return distance < threshold
    }

    const scrollToBottom = () => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
        }

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

    useEffect(() => {
        const container = chatContainerRef.current
        if (!container) return

        const handleScroll = () => {
            const shouldScroll = isNearBottom()
            setShouldAutoScroll(shouldScroll)
        }

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (!isInitialized) {
            loadChatHistory()
            setIsInitialized(true)
        }
    }, [isInitialized])

    useEffect(() => {
        if (messages.length > 0) {
            requestAnimationFrame(() => {
                scrollToBottom()
            })
        }
    }, [messages])

    useEffect(() => {
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
                setMessages(history.messages.map((msg, index) => ({
                    id: index,
                    content: msg.message,
                    sender: msg.is_bot ? 'ai' : 'user'
                })))
                requestAnimationFrame(() => {
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

        requestAnimationFrame(() => {
            scrollToBottom()
        })

        await chatAPI.saveChatHistory(message, false)

        const loadingMessage = {
            id: messages.length + 1,
            content: '',
            sender: 'ai',
            loading: true
        }
        setMessages(prev => [...prev, loadingMessage])
        setIsLoading(true)

        try {
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

            eventSource.addEventListener('message', function (event) {
                try {
                    if (event.data) {
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

                            if (shouldAutoScroll) {
                                scrollToBottom()
                            }
                        }
                    }
                } catch (error) {
                    console.error('處理SSE消息時出錯:', error)
                }
            })

            eventSource.addEventListener('end', function (event) {
                eventSource.close()
                setIsLoading(false)
                isTypingRef.current = false

                setMessages(prev => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage && lastMessage.sender === 'ai') {
                        lastMessage.loading = false
                        lastMessage.content = fullResponse
                    }
                    return newMessages
                })

                if (shouldAutoScroll) {
                    setTimeout(() => {
                        scrollToBottom()
                    }, 100)
                }

                if (fullResponse) {
                    chatAPI.saveChatHistory(fullResponse, true)
                }
            })

            eventSource.addEventListener('error', function (event) {
                console.error('SSE錯誤:', event)
                eventSource.close()
                setIsLoading(false)

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