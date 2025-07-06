import React, { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PlayIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'
import ParameterInput from './ParameterInput'
import ResultDisplay from './ResultDisplay'
import { SDKMethod } from '../types/playground'

interface MethodCardProps {
  method: SDKMethod
  isOpen: boolean
  onToggle: () => void
  onExecute: (method: SDKMethod, params: { [key: string]: string }) => Promise<any>
  parameterValues: { [key: string]: string }
  onParameterChange: (paramName: string, value: string) => void
  result?: any
  isLoading?: boolean
}

const MethodCard: React.FC<MethodCardProps> = ({
  method,
  isOpen,
  onToggle,
  onExecute,
  parameterValues,
  onParameterChange,
  result,
  isLoading
}) => {
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core Operations':
        return '⚡'
      case 'Transaction Decoding':
        return '🔍'
      case 'Token Creation':
        return '💎'
      case 'Balance Management':
        return '💰'
      case 'RPC Operations':
        return '🌐'
      case 'Decoder Operations':
        return '🔧'
      default:
        return '📋'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core Operations':
        return 'blue'
      case 'Transaction Decoding':
        return 'green'
      case 'Token Creation':
        return 'purple'
      case 'Balance Management':
        return 'yellow'
      case 'RPC Operations':
        return 'pink'
      case 'Decoder Operations':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const generateCode = () => {
    const args = method.parameters.map(param => {
      const value = parameterValues[param.name] || param.default || ''
      if (param.type === 'string') {
        return `'${value}'`
      } else if (param.type === 'number') {
        return value
      } else if (param.type === 'boolean') {
        return value
      } else if (param.type === 'object') {
        return value
      }
      return value
    }).filter(Boolean)

    if (method.parameters.length === 0) {
      return `const result = await sdk.${method.name}()`
    } else if (method.parameters.length === 1) {
      return `const result = await sdk.${method.name}(${args[0]})`
    } else {
      const options = method.parameters.slice(1).map(param => {
        const value = parameterValues[param.name] || param.default || ''
        if (value && value !== param.default) {
          return `  ${param.name}: ${param.type === 'string' ? `'${value}'` : value}`
        }
        return null
      }).filter(Boolean)

      if (options.length > 0) {
        return `const result = await sdk.${method.name}(${args[0]}, {
${options.join(',\n')}
})`
      } else {
        return `const result = await sdk.${method.name}(${args[0]})`
      }
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleExecute = async () => {
    await onExecute(method, parameterValues)
  }

  const color = getCategoryColor(method.category)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getCategoryIcon(method.category)}</span>
          <div className="text-left">
            <h3 className="font-medium text-gray-900">{method.name}</h3>
            <p className="text-sm text-gray-600">{method.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            color === 'blue' ? 'bg-blue-100 text-blue-800' :
            color === 'green' ? 'bg-green-100 text-green-800' :
            color === 'purple' ? 'bg-purple-100 text-purple-800' :
            color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            color === 'pink' ? 'bg-pink-100 text-pink-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {method.category}
          </span>
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-6 pb-6 space-y-4">
          {/* Parameters */}
          {method.parameters.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Parameters</h4>
              {method.parameters.map((param) => (
                <ParameterInput
                  key={param.name}
                  parameter={param}
                  value={parameterValues[param.name] || param.default || ''}
                  onChange={(value) => onParameterChange(param.name, value)}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
                color === 'pink' ? 'bg-pink-600 hover:bg-pink-700' :
                'bg-gray-600 hover:bg-gray-700'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  <span>Execute Method</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowCode(!showCode)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </button>
          </div>

          {/* Generated Code */}
          {showCode && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">Generated Code</h5>
                <button
                  onClick={() => copyToClipboard(generateCode())}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-sm text-gray-800 bg-white rounded border p-3 overflow-x-auto">
                <code>{generateCode()}</code>
              </pre>
            </div>
          )}

          {/* Result */}
          {result && (
            <ResultDisplay result={result} methodName={method.name} />
          )}
        </div>
      )}
    </div>
  )
}

export default MethodCard 