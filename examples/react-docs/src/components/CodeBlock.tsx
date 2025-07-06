import { useState } from 'react'
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'

interface CodeBlockProps {
  code: string
  language: string
  title?: string
  id?: string
  onCopy?: (code: string, id?: string) => void
  copied?: boolean
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language, 
  title, 
  id, 
  onCopy, 
  copied: externalCopied 
}) => {
  const [internalCopied, setInternalCopied] = useState(false)
  const copied = externalCopied !== undefined ? externalCopied : internalCopied

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    if (onCopy) {
      onCopy(code, id)
    } else {
      setInternalCopied(true)
      setTimeout(() => setInternalCopied(false), 2000)
    }
  }

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm font-medium text-gray-300">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                <span className="text-xs">Copied!</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="h-4 w-4" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      <div className="relative">
        {!title && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors z-10"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <ClipboardIcon className="h-4 w-4" />
            )}
          </button>
        )}
        <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock 