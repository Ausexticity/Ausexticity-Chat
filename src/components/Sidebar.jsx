import { PlusIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'
import { useState, useRef, useEffect } from 'react'

const models = [
    'anthropic/claude-3.5-sonnet',
    'openai/chatgpt-4o-latest',
]

const modelDisplayNames = {
    'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'openai/chatgpt-4o-latest': 'ChatGPT 4o',
}

export default function Sidebar({
    conversations,
    currentConversationId,
    onConversationSelect,
    onNewConversation,
    selectedModel,
    onModelSelect
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <aside className="h-full flex flex-col">
            {/* 品牌標誌 */}
            <a href="/" rel="noopener noreferrer">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <img src="/images/header_logo.svg" alt="Logo" className="h-8 w-8" />
                        <img src="/images/ausexticity.svg" alt="Ausexticity" className="h-4" />
                    </div>
                </div>
            </a>

            {/* 對話列表 */}
            <div className="flex-1 overflow-y-auto p-4 pt-4">
                <div className="space-y-2">
                    {conversations.map(conversation => (
                        <button
                            key={conversation.id}
                            onClick={() => onConversationSelect(conversation.id)}
                            className={classNames(
                                'tab-button w-full text-left',
                                { 'tab-button-active': conversation.id === currentConversationId }
                            )}
                        >
                            {conversation.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* 底部固定區域 */}
            <div className="flex flex-col border-t border-gray-200">
                {/* 新增對話按鈕 */}
                <button
                    onClick={onNewConversation}
                    className="flex items-center justify-center gap-2 px-4 py-3 hover:bg-gray-50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>新對話</span>
                </button>

                {/* 模型選擇 */}
                <div className="p-4 border-t border-gray-200" ref={dropdownRef}>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {modelDisplayNames[selectedModel]}
                            </span>
                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                        </button>

                        {/* 下拉選單 */}
                        {isDropdownOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                <div className="py-1">
                                    {models.map(model => (
                                        <button
                                            key={model}
                                            onClick={() => {
                                                onModelSelect(model)
                                                setIsDropdownOpen(false)
                                            }}
                                            className={classNames(
                                                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50',
                                                {
                                                    'text-primary-600 bg-primary-50': model === selectedModel,
                                                    'text-gray-700': model !== selectedModel
                                                }
                                            )}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            {modelDisplayNames[model]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    )
} 