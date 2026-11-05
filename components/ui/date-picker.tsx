"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  align?: "left" | "right";
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className,
  disabled = false,
  align = "left",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value or fallback to today
  const parsedDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value) : null;
  const today = new Date();

  const [viewYear, setViewYear] = useState(parsedDate ? parsedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate ? parsedDate.getMonth() : today.getMonth());

  // Update view month/year when value changes externally
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const t = new Date();
    const year = t.getFullYear();
    const month = String(t.getMonth() + 1).padStart(2, "0");
    const day = String(t.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
    setViewYear(year);
    setViewMonth(t.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  // Generate calendar days
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Range of years for fast selection (e.g., currentYear - 5 to currentYear + 15)
  const currentYear = today.getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 15; y++) {
    yearOptions.push(y);
  }

  // Display label: format to DD/MM/YYYY
  const displayLabel = (() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  })();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button / Input Display */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-8 px-2.5 text-xs rounded border flex items-center justify-between text-left transition-colors cursor-pointer",
          "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
          "hover:border-zinc-300 dark:hover:border-zinc-700",
          "focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-300",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-zinc-950 dark:border-zinc-300 ring-1 ring-zinc-950 dark:ring-zinc-300",
          className
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          <CalendarIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          {displayLabel ? (
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              {displayLabel}
            </span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">{placeholder}</span>
          )}
        </div>

        {value && !disabled && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer shrink-0"
            title="Hapus tanggal"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Popover Kalender */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1.5 z-50 w-64 p-3 rounded-lg border shadow-xl",
            "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {/* Header Kalender (Bulan & Tahun Picker) */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800 gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-1">
              {/* Select Bulan */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="h-6 text-[11px] font-semibold bg-transparent border-0 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer focus:ring-0 px-1"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    {m}
                  </option>
                ))}
              </select>

              {/* Select Tahun */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="h-6 text-[11px] font-semibold bg-transparent border-0 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer focus:ring-0 px-1"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="Bulan selanjutnya"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Grid Nama Hari */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d, i) => (
              <span
                key={d}
                className={cn(
                  "text-[10px] font-semibold py-0.5",
                  i === 0 ? "text-rose-500" : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Padding hari kosong sebelum tanggal 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-6 w-full" />
            ))}

            {/* Tombol Setiap Tanggal */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedMonth = String(viewMonth + 1).padStart(2, "0");
              const formattedDay = String(dayNum).padStart(2, "0");
              const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;

              const isSelected = value === dateStr;
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={cn(
                    "h-6 w-full text-[11px] rounded flex items-center justify-center transition-colors cursor-pointer font-normal",
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
                    isToday && !isSelected && "border border-zinc-400 dark:border-zinc-600 font-semibold"
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Aksi Cepat */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium cursor-pointer"
            >
              Hari Ini
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

