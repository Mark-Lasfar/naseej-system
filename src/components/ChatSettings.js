import React, { useState, useEffect } from 'react';
import { FaPalette, FaFont, FaCheck } from 'react-icons/fa';

const ChatSettings = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate({ [key]: value });
    
    // Show preview feedback
    setShowPreview(true);
    setTimeout(() => setShowPreview(false), 1500);
  };

  // Preset color schemes
  const colorPresets = [
    { name: 'Default Blue', bubbleColor: '#3b82f6', otherBubbleColor: '#f3f4f6', backgroundColor: '#f9fafb' },
    { name: 'Dark Mode', bubbleColor: '#10b981', otherBubbleColor: '#374151', backgroundColor: '#1f2937' },
    { name: 'Sunset', bubbleColor: '#f59e0b', otherBubbleColor: '#fef3c7', backgroundColor: '#fffbeb' },
    { name: 'Midnight', bubbleColor: '#8b5cf6', otherBubbleColor: '#1e1b4b', backgroundColor: '#0f172a' },
    { name: 'Rose', bubbleColor: '#ec4899', otherBubbleColor: '#fce7f3', backgroundColor: '#fff1f2' },
    { name: 'Ocean', bubbleColor: '#06b6d4', otherBubbleColor: '#cffafe', backgroundColor: '#ecfeff' }
  ];

  const applyPreset = (preset) => {
    handleChange('bubbleColor', preset.bubbleColor);
    handleChange('otherBubbleColor', preset.otherBubbleColor);
    handleChange('backgroundColor', preset.backgroundColor);
  };

  return (
    <div className="space-y-4">
      {/* Preview Toast */}
      {showPreview && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50 animate-pulse">
          <FaCheck className="inline mr-2" /> Settings applied
        </div>
      )}

      {/* Color Presets */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <FaPalette className="text-blue-500" /> Color Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          {colorPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="p-2 rounded-lg border hover:border-blue-500 transition text-xs"
              title={preset.name}
            >
              <div className="flex gap-1 mb-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.bubbleColor }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.otherBubbleColor }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.backgroundColor }} />
              </div>
              <span className="text-gray-600">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="my-2" />

      {/* My Message Color */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: localSettings.bubbleColor }} />
          My Message Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={localSettings.bubbleColor}
            onChange={(e) => handleChange('bubbleColor', e.target.value)}
            className="w-16 h-10 rounded border cursor-pointer"
          />
          <input
            type="text"
            value={localSettings.bubbleColor}
            onChange={(e) => handleChange('bubbleColor', e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Their Message Color */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: localSettings.otherBubbleColor }} />
          Their Message Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={localSettings.otherBubbleColor}
            onChange={(e) => handleChange('otherBubbleColor', e.target.value)}
            className="w-16 h-10 rounded border cursor-pointer"
          />
          <input
            type="text"
            value={localSettings.otherBubbleColor}
            onChange={(e) => handleChange('otherBubbleColor', e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: localSettings.backgroundColor }} />
          Background Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={localSettings.backgroundColor}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="w-16 h-10 rounded border cursor-pointer"
          />
          <input
            type="text"
            value={localSettings.backgroundColor}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      <hr className="my-2" />

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <FaFont className="text-gray-500" /> Font Size
        </label>
        <div className="flex gap-2">
          <select
            value={localSettings.fontSize}
            onChange={(e) => handleChange('fontSize', e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          >
            <option value="12px">Small (12px)</option>
            <option value="14px">Medium (14px)</option>
            <option value="16px">Large (16px)</option>
            <option value="18px">Extra Large (18px)</option>
            <option value="20px">XX Large (20px)</option>
          </select>
          <div 
            className="px-3 py-2 border rounded-lg bg-gray-50 flex items-center"
            style={{ fontSize: localSettings.fontSize }}
          >
            Aa
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <FaFont className="text-gray-500" /> Font Family
        </label>
        <select
          value={localSettings.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="sans-serif">Sans Serif (Clean & Modern)</option>
          <option value="serif">Serif (Elegant & Traditional)</option>
          <option value="monospace">Monospace (Technical)</option>
          <option value="cursive">Cursive (Handwritten Style)</option>
          <option value="system-ui">System UI (Default)</option>
          <option value="'Segoe UI', Roboto, Helvetica, Arial">Segoe UI / Roboto</option>
          <option value="'Inter', sans-serif">Inter (Modern)</option>
          <option value="'Poppins', sans-serif">Poppins (Stylish)</option>
        </select>
      </div>

      {/* Preview Section */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <p className="text-xs text-gray-500 mb-2 text-center">Preview</p>
        <div className="flex flex-col gap-2">
          <div 
            className="px-3 py-2 rounded-2xl max-w-[80%] text-white"
            style={{ 
              background: `linear-gradient(135deg, ${localSettings.bubbleColor}, ${localSettings.bubbleColor === '#3b82f6' ? '#2563eb' : '#1e40af'})`,
              fontSize: localSettings.fontSize,
              fontFamily: localSettings.fontFamily
            }}
          >
            Your message preview
          </div>
          <div 
            className="px-3 py-2 rounded-2xl max-w-[80%] text-gray-800 shadow-sm"
            style={{ 
              backgroundColor: localSettings.otherBubbleColor,
              fontSize: localSettings.fontSize,
              fontFamily: localSettings.fontFamily
            }}
          >
            Their message preview
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          handleChange('bubbleColor', '#3b82f6');
          handleChange('otherBubbleColor', '#f3f4f6');
          handleChange('backgroundColor', '#f9fafb');
          handleChange('fontSize', '14px');
          handleChange('fontFamily', 'sans-serif');
        }}
        className="w-full py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition mt-2"
      >
        Reset to Default
      </button>
    </div>
  );
};

export default ChatSettings;