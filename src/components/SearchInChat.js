import React from 'react';
import { FaSearch, FaArrowUp, FaArrowDown, FaTimes } from 'react-icons/fa';

const SearchInChat = ({ 
  searchInChat, 
  setSearchInChat, 
  searchResultsCount, 
  currentSearchIndex,
  onPrevResult,
  onNextResult,
  onClear 
}) => {
  return (
    <div className="px-4 py-2 bg-white border-b flex items-center gap-2">
      <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search in this conversation..."
          value={searchInChat}
          onChange={(e) => setSearchInChat(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {searchResultsCount > 0 && (
        <div className="flex gap-1">
          <span className="text-xs text-gray-500">
            {currentSearchIndex + 1}/{searchResultsCount}
          </span>
          <button onClick={onPrevResult} className="p-1 hover:bg-gray-100 rounded">
            <FaArrowUp size={12} />
          </button>
          <button onClick={onNextResult} className="p-1 hover:bg-gray-100 rounded">
            <FaArrowDown size={12} />
          </button>
          <button onClick={onClear} className="p-1 hover:bg-gray-100 rounded">
            <FaTimes size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchInChat;