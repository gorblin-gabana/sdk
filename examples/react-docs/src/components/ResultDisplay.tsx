import React, { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClipboardIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface ResultDisplayProps {
  result: any;
  methodName: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  methodName,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const isError = result?.error || result?.success === false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isError ? (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          )}
          <h5 className="font-medium text-gray-900">
            {isError ? "Execution Failed" : "Execution Result"}
          </h5>
        </div>
        <button
          onClick={() => copyToClipboard(formatJson(result))}
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

      <div
        className={`rounded-lg p-4 ${isError ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}
      >
        {/* Quick Summary */}
        {result?.timestamp && (
          <div className="text-xs text-gray-600 mb-2">
            Executed at: {new Date(result.timestamp).toLocaleString()}
            {result?.executionTime && (
              <span className="ml-2">({result.executionTime}ms)</span>
            )}
          </div>
        )}

        {/* Error Display */}
        {isError && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-800">
              {result?.error || "Unknown error occurred"}
            </div>
            {result?.details && (
              <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
                {result.details}
              </div>
            )}
          </div>
        )}

        {/* Success Display */}
        {!isError && (
          <div className="space-y-2">
            {/* Special handling for specific method types */}
            {methodName === "getNetworkHealth" && result?.status && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      result.status === "healthy"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                {result.latency && (
                  <div>
                    <span className="font-medium">Latency:</span>
                    <span className="ml-2">{result.latency}ms</span>
                  </div>
                )}
              </div>
            )}

            {/* Transaction-specific display */}
            {methodName === "getAndDecodeTransaction" &&
              result?.transactionType && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Type:</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {result.transactionType}
                    </span>
                  </div>
                  {result.transactionSubtype && (
                    <div className="text-sm">
                      <span className="font-medium">Subtype:</span>
                      <span className="ml-2">{result.transactionSubtype}</span>
                    </div>
                  )}
                  {result.analysis && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Instructions:</span>
                        <span className="ml-2">
                          {result.analysis.totalInstructions}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Compute Units:</span>
                        <span className="ml-2">
                          {result.analysis.totalComputeUnits}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Token info display */}
            {result?.tokenInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  Token Information
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Operations:</span>
                    <span className="ml-2">
                      {result.tokenInfo.totalOperations}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Accounts:</span>
                    <span className="ml-2">
                      {result.tokenInfo.totalAccounts}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full JSON Display */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            View Full Response
          </summary>
          <pre className="mt-2 text-xs text-gray-600 bg-white border rounded p-3 overflow-x-auto max-h-96">
            <code>{formatJson(result)}</code>
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ResultDisplay;
