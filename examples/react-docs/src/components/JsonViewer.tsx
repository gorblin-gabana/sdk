import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline'

interface JsonViewerProps {
  data: any
  title?: string
  collapsible?: boolean
}

function renderValue(value: any, key: string, depth: number = 0): JSX.Element {
  if (value === null) {
    return <span className="text-gray-400">null</span>
  }
  
  if (value === undefined) {
    return <span className="text-gray-400">undefined</span>
  }
  
  if (typeof value === 'boolean') {
    return <span className="text-purple-600">{value.toString()}</span>
  }
  
  if (typeof value === 'number') {
    return <span className="text-blue-600">{value}</span>
  }
  
  if (typeof value === 'string') {
    // Special formatting for different types of strings
    if (value.match(/^[1-9A-HJ-NP-Za-km-z]{32,}$/)) {
      // Looks like a base58 address
      return <span className="text-green-600 font-mono">"{value}"</span>
    }
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // Looks like a timestamp
      return <span className="text-orange-600">"{value}"</span>
    }
    return <span className="text-red-600">"{value}"</span>
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500">[]</span>
    }
    
    return (
      <CollapsibleArray 
        items={value} 
        depth={depth}
        maxPreview={3}
      />
    )
  }
  
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) {
      return <span className="text-gray-500">{'{}'}</span>
    }
    
    return (
      <CollapsibleObject 
        obj={value} 
        depth={depth}
        maxPreview={3}
      />
    )
  }
  
  return <span>{String(value)}</span>
}

function CollapsibleObject({ obj, depth, maxPreview }: { obj: any, depth: number, maxPreview: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const keys = Object.keys(obj)
  const shouldCollapse = keys.length > maxPreview && depth > 0

  if (!expanded && shouldCollapse) {
    return (
      <span>
        <button
          onClick={() => setExpanded(true)}
          className="text-blue-500 hover:text-blue-700"
        >
          {'{'}{keys.length} keys{'}'}
        </button>
      </span>
    )
  }

  return (
    <div>
      <span className="text-gray-600">{'{'}</span>
      <div className="ml-4 space-y-1">
        {keys.map((key, index) => (
          <div key={key}>
            <span className="text-blue-700">"{key}"</span>
            <span className="text-gray-600">: </span>
            <span>{renderValue(obj[key], key, depth + 1)}</span>
            {index < keys.length - 1 && <span className="text-gray-600">,</span>}
          </div>
        ))}
      </div>
      <span className="text-gray-600">{'}'}</span>
      {shouldCollapse && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700"
        >
          collapse
        </button>
      )}
    </div>
  )
}

function CollapsibleArray({ items, depth, maxPreview }: { items: any[], depth: number, maxPreview: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const shouldCollapse = items.length > maxPreview && depth > 0

  if (!expanded && shouldCollapse) {
    return (
      <span>
        <button
          onClick={() => setExpanded(true)}
          className="text-blue-500 hover:text-blue-700"
        >
          [{items.length} items]
        </button>
      </span>
    )
  }

  return (
    <div>
      <span className="text-gray-600">[</span>
      <div className="ml-4 space-y-1">
        {items.slice(0, expanded ? items.length : maxPreview).map((item, index) => (
          <div key={index}>
            <span>{renderValue(item, index.toString(), depth + 1)}</span>
            {index < items.length - 1 && <span className="text-gray-600">,</span>}
          </div>
        ))}
        {!expanded && items.length > maxPreview && (
          <div className="text-gray-500 text-xs">
            ... {items.length - maxPreview} more items
          </div>
        )}
      </div>
      <span className="text-gray-600">]</span>
      {shouldCollapse && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700"
        >
          collapse
        </button>
      )}
    </div>
  )
}

export default function JsonViewer({ data, title, collapsible = true }: JsonViewerProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between p-3 border-b bg-gray-100 rounded-t-lg">
        <div className="flex items-center space-x-2">
          {collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {collapsed ? 
                <ChevronRightIcon className="w-4 h-4" /> : 
                <ChevronDownIcon className="w-4 h-4" />
              }
            </button>
          )}
          <h4 className="font-medium text-gray-900">{title || 'JSON Result'}</h4>
          <span className="text-xs text-gray-500">
            {typeof data === 'object' && data !== null ? 
              `${Array.isArray(data) ? data.length + ' items' : Object.keys(data).length + ' keys'}` : 
              typeof data
            }
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
        >
          {copied ? <CheckIcon className="w-3 h-3" /> : <DocumentDuplicateIcon className="w-3 h-3" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-4 font-mono text-sm overflow-x-auto">
          <div className="space-y-1">
            {renderValue(data, 'root')}
          </div>
        </div>
      )}
    </div>
  )
} 