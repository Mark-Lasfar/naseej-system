import React from 'react';
import { FaReply, FaCopy, FaTrash, FaFlag } from 'react-icons/fa';

const MessageActions = ({ message, onReply, onCopy, onDelete, onReport, onClose }) => {
  return (
    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20 min-w-[160px] border">
      <button
        onClick={() => { onReply(message); onClose(); }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 transition"
      >
        <FaReply size={14} className="text-blue-500" /> Reply
      </button>
      <button
        onClick={() => { onCopy(message.text); onClose(); }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 transition"
      >
        <FaCopy size={14} className="text-gray-500" /> Copy
      </button>
      <button
        onClick={() => { onDelete(message._id); onClose(); }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 transition"
      >
        <FaTrash size={14} className="text-red-500" /> Delete
      </button>
      <hr className="my-1" />
      <button
        onClick={() => { onReport(message._id); onClose(); }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 transition"
      >
        <FaFlag size={14} className="text-orange-500" /> Report
      </button>
    </div>
  );
};

export default MessageActions;