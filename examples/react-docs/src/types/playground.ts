export interface Parameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  default?: string
  options?: string[]
}

export interface SDKMethod {
  id: string
  name: string
  description: string
  category: string
  parameters: Parameter[]
  returnType: string
  example: string
}

export interface ExecutionResult {
  success: boolean
  data?: any
  error?: string
  timestamp: string
  executionTime?: number
}

export interface MethodState {
  isOpen: boolean
  isLoading: boolean
  parameters: { [key: string]: string }
  result?: ExecutionResult
  showCode: boolean
} 