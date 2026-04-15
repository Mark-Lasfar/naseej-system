import React from 'react';
import { FaReply, FaTimes } from 'react-icons/fa';

const ReplyPreview = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  return (
    <div className="bg-blue-50 px-4 py-2 border-b flex justify-between items-center">
      <div className="flex items-center gap-2 text-sm flex-1">
        <FaReply className="text-blue-400" />
        <div className="flex-1">
          <span className="text-gray-500">Replying to:</span>
          <div className="text-gray-700 font-medium truncate max-w-md">
            {replyTo.text}
          </div>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="text-gray-400 hover:text-gray-600 ml-2"
        title="Cancel reply"
      >
        <FaTimes size={14} />
      </button>
    </div>
  );
};

export default ReplyPreview;