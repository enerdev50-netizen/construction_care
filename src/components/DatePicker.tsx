import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './DatePicker.css';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const WEEKDAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  required = false
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [openLeftward, setOpenLeftward] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleCalendar = () => {
    if (!showCalendar && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      const modalEl = containerRef.current.closest('.modal-content');
      let spaceRight = window.innerWidth - rect.left;
      if (modalEl) {
        const modalRect = modalEl.getBoundingClientRect();
        spaceRight = modalRect.right - rect.left;
      }

      setOpenUpward(spaceBelow < 340);
      setOpenLeftward(spaceRight < 310);
    }
    setShowCalendar(!showCalendar);
  };

  // Sync calendar view if value changes externally
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [value]);

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent manual entry from messing up raw state unless valid
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    const selectedYear = viewDate.getFullYear();
    const selectedMonth = String(viewDate.getMonth() + 1).padStart(2, '0');
    const selectedDay = String(dayNum).padStart(2, '0');
    onChange(`${selectedYear}-${selectedMonth}-${selectedDay}`);
    setShowCalendar(false);
  };

  // Generate days grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  // Adjust JS getDay() (Sunday=0) to French standard week (Monday=0, Sunday=6)
  let startDayOfWeek = firstDayOfMonth.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  interface DaysGridItem {
    day: number;
    isCurrentMonth: boolean;
    isPrevMonth: boolean;
  }

  const daysGrid: DaysGridItem[] = [];

  // Trailing days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevDaysInMonth - i,
      isCurrentMonth: false,
      isPrevMonth: true
    });
  }

  // Days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push({
      day: i,
      isCurrentMonth: true,
      isPrevMonth: false
    });
  }

  // Leading days of next month to complete 6 weeks (42 cells)
  const remainingCells = 42 - daysGrid.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysGrid.push({
      day: i,
      isCurrentMonth: false,
      isPrevMonth: false
    });
  }

  // Helpers to determine selected / today styling
  const isSelected = (dayNum: number) => {
    if (!value) return false;
    const [valY, valM, valD] = value.split('-').map(Number);
    return valY === year && valM === (month + 1) && valD === dayNum;
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayNum;
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY for nicer display
  const getDisplayValue = () => {
    if (!value) return '';
    const [valY, valM, valD] = value.split('-');
    return `${valD}/${valM}/${valY}`;
  };

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <div className="custom-datepicker-input-wrapper" onClick={toggleCalendar}>
        <input
          type="text"
          readOnly
          className="custom-datepicker-input"
          placeholder={placeholder}
          value={getDisplayValue()}
          onChange={handleInputChange}
          required={required}
        />
        {value && (
          <button type="button" className="custom-datepicker-clear-btn" onClick={handleClear}>
            <X size={14} />
          </button>
        )}
        <span className="custom-datepicker-icon">
          <CalendarIcon size={16} />
        </span>
      </div>

      {showCalendar && (
        <div className={`custom-datepicker-popover${openUpward ? ' open-upward' : ''}${openLeftward ? ' open-leftward' : ''}`}>
          <div className="custom-datepicker-header">
            <button type="button" className="custom-datepicker-nav-btn" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className="custom-datepicker-month-year">
              {MONTHS_FR[month]} {year}
            </span>
            <button type="button" className="custom-datepicker-nav-btn" onClick={nextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="custom-datepicker-weekdays">
            {WEEKDAYS_FR.map((wd, i) => (
              <span key={i} className="custom-datepicker-weekday">
                {wd}
              </span>
            ))}
          </div>

          <div className="custom-datepicker-days">
            {daysGrid.map((item, index) => {
              if (!item.isCurrentMonth) {
                return (
                  <span key={index} className="custom-datepicker-day empty">
                    {item.day}
                  </span>
                );
              }
              const selected = isSelected(item.day);
              const today = isToday(item.day);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDaySelect(item.day)}
                  className={`custom-datepicker-day${selected ? ' selected' : ''}${today ? ' today' : ''}`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
