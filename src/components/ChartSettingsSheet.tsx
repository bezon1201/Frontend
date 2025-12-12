import { X, ChevronLeft, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

// Screen: ChartSettingsScreen (component: ChartSettingsSheet, screen_id: "chart_settings")
//
// Назначение:
// - модалка/шторка "Chart settings", открывается с DashboardScreen по нажатию на "⋯" справа от заголовка графика;
// - позволяет выбрать:
//   * источник данных для графика (Data source),
//   * метрику (Metric),
//   * группу временного диапазона (Time range group),
//   * конкретный временной диапазон (Time range).
//
// API (домен Chart Settings):
// - GET /api/chart/settings
//     Прочитать текущие настройки графика для пользователя
//     (data_source_type, data_source_id, metric, range_group, range_value).
// - PUT /api/chart/settings
//     Сохранить новые настройки графика для пользователя.
// - GET /api/chart/sources
//     Получить список доступных источников данных
//     (Portfolio, отдельные активы, классы активов, аку��ты).
// - GET /api/chart/metrics?source_type=...
//     Получить список доступных метрик для выбранного типа источника.
//
// Связь с DashboardScreen:
// - DashboardScreen открывает ChartSettingsSheet по нажатию на "⋯".
// - После успешного PUT /api/chart/settings DashboardScreen должен
//   перезапросить данные графика через GET /api/dashboard/chart и перерисовать кривую.

interface ChartSettingsSheetProps {
  // Открыта ли модалка "Chart settings".
  isOpen: boolean;

  // Закрыть модалку без сохранения изменений.
  onClose: () => void;

  // Текущие настройки графика, которые прокидывает DashboardScreen.
  // На уровне приложения они должны быть синхронизированы с /api/chart/settings.
  currentSettings: {
    // UI-обёртка над парой API-полей data_source_type + data_source_id.
    dataSource: string;

    // UI-обёртка над API-полем metric.
    metric: string;

    // UI-обёртка над парой API-полей range_group + range_value
    // (например, "1m", "1h", "7d", "3M" и т.п.).
    timeRange: string;
  };

  // Callback при нажатии "Save changes".
  // В текущей реализации:
  // - пробрасывает выбранные значения наверх (DashboardScreen),
  // - там уже будет вызов PUT /api/chart/settings и refetch GET /api/dashboard/chart.
  onSave: (settings: { dataSource: string; metric: string; timeRange: string }) => void;
}

export default function ChartSettingsSheet({
  isOpen,
  onClose,
  currentSettings,
  onSave
}: ChartSettingsSheetProps) {
  // Локальное состояние для формы:
  //
  // dataSource  — выбранный источник данных для графика (Portfolio / Crypto / Stocks / конкретный аккаунт и т.д.).
  // metric      — выбранная метрика (Value, PnL, Quantity и т.п.).
  // timeRange   — выбранный временной диапазон (строка вида "1m", "4h", "7d", "3M", "All" и т.п.).
  //
  // Маппинг на поля API /api/chart/settings:
  // - dataSource  → API: data_source_type + data_source_id
  // - metric      → API: metric
  // - timeRange   → API: range_group + range_value (группа + конкретное значение).
  const [dataSource, setDataSource] = useState(currentSettings.dataSource);
  const [metric, setMetric] = useState(currentSettings.metric);
  const [timeRange, setTimeRange] = useState(currentSettings.timeRange);

  // Наборы значений для слайдера "Time range" по каждой группе.
  // Маппятся на API-поля range_group + range_value:
  // - ключи объекта → range_group ("Minutes", "Hours", "Days", "Weeks", "Months", "Years", "All time"),
  // - элементы массивов → range_value ("1m", "5m", "1h", "7d", "1M", "3M", "1y" и т.п.).
  //
  // Пример маппинга:
  // - group "Minutes" + value "5m" => range_group = "minutes", range_value = "5m"
  // - group "Months"  + value "3m" => range_group = "months",  range_value = "3m"
  const timeRangeGroups = {
    'Minutes': ['1m', '5m', '15m', '30m'],
    'Hours': ['1h', '2h', '4h', '12h'],
    'Days': ['1d', '3d', '7d', '14d'],
    'Weeks': ['1w', '2w', '4w', '12w'],
    'Months': ['1m', '3m', '6m', '12m'],
    'Years': ['1y', '3y', '5y'],
    'All time': []
  };

  // Вспомогательная функция:
  // по строковому значению timeRange (например "1m", "7d", "3M", "All")
  // определяет, к какой группе (Minutes / Hours / Days / Weeks / Months / Years / All time)
  // относится текущий диапазон.
  const getCurrentGroup = (range: string): string => {
    if (range === 'All') return 'All time';
    
    for (const [group, values] of Object.entries(timeRangeGroups)) {
      if (values.includes(range)) return group;
    }
    return 'Minutes'; // default
  };

  // Текущая выбранная группа интервалов (Minutes / Hours / Days / Weeks / Months / Years / All time),
  // завязанная на timeRange и используемая для переключения значений слайдера.
  const [timeRangeGroup, setTimeRangeGroup] = useState<string>(getCurrentGroup(currentSettings.timeRange));

  // TODO API (Chart settings):
  // Сейчас при открытии шторки мы прост копируем currentSettings из props.
  // После интеграции с бэкендом:
  //
  // - при первом открытии (или при загрузке приложения) нужно вызывать GET /api/chart/settings,
  //   чтобы получить актуальные настройки с сервера;
  // - currentSettings в props должны заполняться из ответа GET /api/chart/settings;
  // - ChartSettingsSheet использует currentSettings как источник truth для локального стейта.
  useEffect(() => {
    if (isOpen) {
      setDataSource(currentSettings.dataSource);
      setMetric(currentSettings.metric);
      setTimeRange(currentSettings.timeRange);
      setTimeRangeGroup(getCurrentGroup(currentSettings.timeRange));
    }
  }, [isOpen, currentSettings]);

  // TODO API (Chart settings):
  // Сейчас handleSave просто пробрасывает значения наверх через onSave().
  //
  // После подключения бэкенда:
  // - onSave должен вызывать PUT /api/chart/settings с телом:
  //   {
  //     data_source_type: ...,
  //     data_source_id: ...,
  //     metric: ...,
  //     range_group: ...,
  //     range_value: ...
  //   }
  //   (UI-поля dataSource/metric/timeRange мапятся на структуру, которую ожидает сервер).
  //
  // - при успешном PUT:
  //   - закрыть шторку,
  //   - инициировать обновление графика через GET /api/dashboard/chart (на DashboardScreen),
  //   - показать toast об успешном сохранении настроек.
  // - при ошибке:
  //   - показать toast/alert по error_code (например, INVALID_RANGE, UNKNOWN_DATASOURCE и т.п.).
  const handleSave = () => {
    onSave({ dataSource, metric, timeRange });
  };

  const handleBack = () => {
    setDataSource(currentSettings.dataSource);
    setMetric(currentSettings.metric);
    setTimeRange(currentSettings.timeRange);
    setTimeRangeGroup(getCurrentGroup(currentSettings.timeRange));
    onClose();
  };

  const handleGroupChange = (newGroup: string) => {
    setTimeRangeGroup(newGroup);
    
    // Set default value for the new group
    if (newGroup === 'All time') {
      setTimeRange('All');
    } else {
      const groupValues = timeRangeGroups[newGroup as keyof typeof timeRangeGroups];
      if (groupValues && groupValues.length > 0) {
        setTimeRange(groupValues[0]); // Set to first value in group
      }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const groupValues = timeRangeGroups[timeRangeGroup as keyof typeof timeRangeGroups];
    if (groupValues && groupValues[index]) {
      setTimeRange(groupValues[index]);
    }
  };

  if (!isOpen) return null;

  // Опции для выпадающих списков:
  //
  // Data source:
  // - значения маппятся на API data_source_type + data_source_id
  //   (Portfolio → type="portfolio", конкретный актив → type="asset" + id и т.п.).
  //
  // Metric:
  // - значения маппятся на API metric (Value, PnL, Quantity и т.д.).
  //
  // Time range group:
  // - используется для выбора ключа из timeRangeGroups (Minutes / Hours / Days / Weeks / Months / Years / All time).
  const dataSourceOptions = ['Portfolio', 'Crypto', 'Stocks', 'Fiat', 'Other'];
  const metricOptions = ['Value', 'PnL', 'Quantity'];
  const groupOptions = Object.keys(timeRangeGroups);

  // Get current slider values for selected group
  const currentGroupValues = timeRangeGroups[timeRangeGroup as keyof typeof timeRangeGroups] || [];
  const currentValueIndex = currentGroupValues.indexOf(timeRange);
  const sliderValue = currentValueIndex >= 0 ? currentValueIndex : 0;

  // Display value for time range
  const getDisplayValue = () => {
    if (timeRangeGroup === 'All time') return 'All time';
    return timeRange;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      {/* Modal Sheet */}
      <div 
        className="bg-white rounded-t-3xl w-full overflow-hidden flex flex-col"
        style={{ 
          height: '90vh',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header - Sticky */}
        <div className="px-4 pb-4 flex items-center justify-between sticky top-0 bg-white z-10 pt-2">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: '#10b981' }}
          >
            <ChevronLeft className="w-6 h-6" />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Back</span>
          </button>

          {/* Title */}
          <div style={{ fontSize: '24px', fontWeight: 'bold', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            Chart settings
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto px-4"
          data-modal-scroll
          style={{
            overscrollBehavior: 'contain',
            paddingBottom: '24px'
          }}
        >
          <div className="space-y-6">
            {/* Section 1: Data source - Dropdown */}
            <div>
              <div className="text-gray-500 mb-2" style={{ fontSize: '14px' }}>
                Data source
              </div>
              <div className="relative">
                <select
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-black appearance-none"
                  style={{ 
                    fontSize: '16px',
                    border: 'none',
                    outline: 'none',
                    paddingRight: '2.5rem'
                  }}
                >
                  {dataSourceOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" 
                  size={20}
                />
              </div>
            </div>

            {/* Section 2: Metric - Dropdown */}
            <div>
              <div className="text-gray-500 mb-2" style={{ fontSize: '14px' }}>
                Metric
              </div>
              <div className="relative">
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-black appearance-none"
                  style={{ 
                    fontSize: '16px',
                    border: 'none',
                    outline: 'none',
                    paddingRight: '2.5rem'
                  }}
                >
                  {metricOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" 
                  size={20}
                />
              </div>
            </div>

            {/* Section 3: Time Range Group - Dropdown */}
            <div>
              <div className="text-gray-500 mb-2" style={{ fontSize: '14px' }}>
                Time range group
              </div>
              <div className="relative">
                <select
                  value={timeRangeGroup}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-black appearance-none"
                  style={{ 
                    fontSize: '16px',
                    border: 'none',
                    outline: 'none',
                    paddingRight: '2.5rem'
                  }}
                >
                  {groupOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" 
                  size={20}
                />
              </div>
            </div>

            {/* Section 4: Time Range Value - Conditional Slider or Text */}
            {timeRangeGroup === 'All time' ? (
              <div>
                <div className="text-gray-500 mb-2" style={{ fontSize: '14px' }}>
                  Time range
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="text-black" style={{ fontSize: '16px' }}>
                    All time
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-gray-500" style={{ fontSize: '14px' }}>
                    Time range
                  </div>
                  <div className="text-black" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {getDisplayValue()}
                  </div>
                </div>
                
                {/* Discrete Slider - Style like Risk Level */}
                <div className="relative mb-2">
                  <input
                    type="range"
                    min="0"
                    max={currentGroupValues.length - 1}
                    step="1"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer discrete-slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(sliderValue / (currentGroupValues.length - 1)) * 100}%, #e5e7eb ${(sliderValue / (currentGroupValues.length - 1)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>

                {/* Labels under slider */}
                <div className="flex justify-between px-1">
                  {currentGroupValues.map((value, index) => (
                    <div
                      key={value}
                      className="flex-1 text-center"
                      style={{
                        fontSize: '11px',
                        color: index === sliderValue ? '#10b981' : '#9A9A9A',
                        fontWeight: index === sliderValue ? 'bold' : 'normal',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button - Inside Scroll */}
            <button
              onClick={handleSave}
              className="w-full py-4 rounded-xl text-white transition-opacity mt-8"
              style={{
                backgroundColor: '#10b981',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Custom Slider Styles */}
      <style>{`
        .discrete-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .discrete-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .discrete-slider:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}