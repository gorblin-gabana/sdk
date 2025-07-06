import React from 'react'
import { Parameter } from '../types/playground'

interface ParameterInputProps {
  parameter: Parameter
  value: string
  onChange: (value: string) => void
}

const ParameterInput: React.FC<ParameterInputProps> = ({ parameter, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  const renderInput = () => {
    switch (parameter.type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={parameter.default || '0'}
          />
        )
      
      case 'object':
        return (
          <textarea
            value={value}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder={parameter.default || '{}'}
          />
        )
      
      case 'array':
        return (
          <textarea
            value={value}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder={parameter.default || '[]'}
          />
        )
      
      default:
        if (parameter.options) {
          return (
            <select
              value={value}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {parameter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )
        }
        
        return (
          <input
            type="text"
            value={value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={parameter.default || ''}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {parameter.name}
          {parameter.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {parameter.type}
        </span>
      </div>
      {renderInput()}
      {parameter.description && (
        <p className="text-xs text-gray-600">{parameter.description}</p>
      )}
    </div>
  )
}

export default ParameterInput 