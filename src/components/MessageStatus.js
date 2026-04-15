import React from 'react';
import { FaCheck, FaCheckDouble, FaRegClock } from 'react-icons/fa';

const MessageStatus = ({ status }) => {
  switch (status) {
    case 'sending':
      return <FaRegClock className="text-gray-400 text-xs" />;
    case 'sent':
      return <FaCheck className="text-gray-400 text-xs" />;
    case 'delivered':
      return <FaCheckDouble className="text-gray-400 text-xs" />;
    case 'read':
      return <FaCheckDouble className="text-blue-500 text-xs" />;
    default:
      return null;
  }
};

export default MessageStatus;