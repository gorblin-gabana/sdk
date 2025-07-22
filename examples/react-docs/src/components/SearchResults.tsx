import React, { useEffect, useRef } from "react";
import { useSearch } from "./SearchContext";
import {
  DocumentTextIcon,
  Cog6ToothIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const SearchResults: React.FC = () => {
  const {
    searchQuery,
    searchResults,
    isSearchOpen,
    setIsSearchOpen,
    selectedIndex,
    setSelectedIndex,
    navigateToResult,
  } = useSearch();

  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen || searchResults.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % searchResults.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + searchResults.length) % searchResults.length,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            navigateToResult(searchResults[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isSearchOpen,
    searchResults,
    selectedIndex,
    setSelectedIndex,
    navigateToResult,
  ]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, setIsSearchOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case "page":
        return <DocumentTextIcon className="h-4 w-4" />;
      case "code":
        return <CodeBracketIcon className="h-4 w-4" />;
      case "section":
        return <DocumentTextIcon className="h-4 w-4" />;
      case "config":
        return <Cog6ToothIcon className="h-4 w-4" />;
      case "error":
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <RocketLaunchIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "code":
        return "text-gorbchain-secondary bg-gorbchain-light";
      case "section":
        return "text-gorbchain-primary bg-green-50";
      default:
        return "text-gorbchain-primary bg-gorbchain-light";
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <span
            key={index}
            className="bg-gorbchain-highlight text-gorbchain-secondary px-0.5 rounded font-medium"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!isSearchOpen || !searchQuery.trim()) {
    return null;
  }

  return (
    <div
      ref={resultsRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      {searchResults.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No results found for "{searchQuery}"</p>
          <p className="text-sm mt-1">
            Try searching for: api, rpc, error, decode, setup
          </p>
        </div>
      ) : (
        <div className="py-2">
          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}{" "}
            found
          </div>

          {searchResults.map((result, index) => (
            <div
              key={result.id}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-green-50 border-l-4 border-gorbchain-primary"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => navigateToResult(result)}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 p-1.5 rounded-md ${getTypeColor(result.type)}`}
                >
                  {getIcon(result.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {highlightMatch(result.title, searchQuery)}
                    </h4>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${getTypeColor(result.type)}`}
                    >
                      {result.type}
                    </span>
                  </div>

                  {result.section && (
                    <p className="text-xs text-gray-500 mt-1">
                      in {result.section}
                    </p>
                  )}

                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {highlightMatch(result.content, searchQuery)}
                  </p>

                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.tags.slice(0, 4).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > 4 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{result.tags.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">
                    ↑↓
                  </kbd>
                  <span className="ml-1">Navigate</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">
                    Enter
                  </kbd>
                  <span className="ml-1">Open</span>
                </span>
              </div>
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">
                  Esc
                </kbd>
                <span className="ml-1">Close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
