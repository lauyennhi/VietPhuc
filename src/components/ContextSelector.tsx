import React, { useState } from 'react';
import { getEvents, getWeatherContexts } from '../lib/dal';

interface ContextSelectorProps {
  selectedEventId: string;
  selectedWeatherId: string;
  selectedLocation: string;
  selectedDate: string;
  onEventChange: (eventId: string) => void;
  onWeatherChange: (weatherId: string) => void;
  onLocationChange: (loc: string) => void;
  onDateChange: (date: string) => void;
  onNaturalLanguageSubmit: (prompt: string) => void;
  isAiParsing: boolean;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  selectedEventId,
  selectedWeatherId,
  selectedLocation,
  selectedDate,
  onEventChange,
  onWeatherChange,
  onLocationChange,
  onDateChange,
  onNaturalLanguageSubmit,
  isAiParsing,
}) => {
  const events = getEvents();
  const weatherContexts = getWeatherContexts();
  const [promptText, setPromptText] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptText.trim()) {
      onNaturalLanguageSubmit(promptText.trim());
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 bg-[#F1EADF] text-[#8A5E17] rounded-xl text-base">🌸</span>
          <h3 className="font-serif text-xl font-bold text-[#1F1B18]">
            Bối Cảnh & Dịp Xuất Hiện
          </h3>
        </div>
        <p className="text-xs text-[#736960] mt-1">
          Chọn không gian, thời tiết hoặc mô tả bằng lời để gợi ý trang phục chuẩn lễ nghi và thanh lịch nhất.
        </p>
      </div>

      {/* AI Smart Prompt Bar */}
      <form onSubmit={handlePromptSubmit} className="space-y-2">
        <label className="block text-xs font-semibold text-[#1F1B18] uppercase tracking-wider font-mono">
          Trợ lý ngữ cảnh thông minh:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Ví dụ: Dự đám cưới bạn thân ở Huế vào một chiều thu se lạnh..."
            className="flex-1 bg-[#FBF8F3] border border-[#E6DCCD] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#1F1B18] focus:outline-none focus:border-[#8B1E2B] transition placeholder:text-[#A89F91]"
          />
          <button
            type="submit"
            disabled={isAiParsing || !promptText.trim()}
            className="press px-5 py-3 rounded-2xl bg-[#8B1E2B] text-[#FFFFFF] text-xs font-bold hover:bg-[#6E1420] disabled:opacity-50 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            {isAiParsing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <span>✨ Phân tích</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Manual Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E6DCCD]/60">
        {/* Event Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1F1B18]">
            Dịp / Sự kiện:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => onEventChange(e.target.value)}
            aria-label="Chọn dịp / sự kiện"
            className="w-full bg-[#FBF8F3] border border-[#E6DCCD] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1B18] focus:outline-none focus:border-[#8B1E2B]"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name} ({evt.formality === 'HIGH_FORMAL' ? 'Rất trang trọng' : evt.formality === 'FORMAL' ? 'Trang trọng' : 'Thường nhật'})
              </option>
            ))}
          </select>
        </div>

        {/* Weather Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1F1B18]">
            Thời tiết / Khí hậu:
          </label>
          <select
            value={selectedWeatherId}
            onChange={(e) => onWeatherChange(e.target.value)}
            aria-label="Chọn thời tiết / khí hậu"
            className="w-full bg-[#FBF8F3] border border-[#E6DCCD] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1B18] focus:outline-none focus:border-[#8B1E2B]"
          >
            {weatherContexts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.temperatureRange})
              </option>
            ))}
          </select>
        </div>

        {/* Location Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1F1B18]">
            Địa điểm / Vùng miền:
          </label>
          <input
            type="text"
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Hà Nội, Cố đô Huế, Sài Gòn..."
            className="w-full bg-[#FBF8F3] border border-[#E6DCCD] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1B18] focus:outline-none focus:border-[#8B1E2B]"
          />
        </div>

        {/* Date Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1F1B18]">
            Thời gian tổ chức:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-[#FBF8F3] border border-[#E6DCCD] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1B18] focus:outline-none focus:border-[#8B1E2B]"
          />
        </div>
      </div>
    </div>
  );
};
