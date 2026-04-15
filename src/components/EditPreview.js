import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const EditPreview = ({ editMessage, onSave, onCancel }) => {
  const [text, setText] = useState(editMessage?.text || '');

  if (!editMessage) return null;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSave(editMessage._id, text);
    }
  };

  return (
    <div className="bg-yellow-50 px-4 py-2 border-b flex justify-between items-center">
      <div className="flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      <button onClick={onCancel} className="ml-2 text-gray-400 hover:text-gray-600">
        <FaTimes size={14} />
      </button>
    </div>
  );
};

export default EditPreview;