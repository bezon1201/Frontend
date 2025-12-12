import { Check, X, ChevronRight, Trash2, ChevronDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner@2.0.3";
import ConfirmMarketSheet from "./ConfirmMarketSheet";
import ConfirmLimitSheet from "./ConfirmLimitSheet";
import ConfirmCancelSheet from "./ConfirmCancelSheet";
import ConfirmRolloverSheet from "./ConfirmRolloverSheet";
import ConfirmStopSheet from "./ConfirmStopSheet";
import CycleIcon from "./CycleIcon";

// Screen: OrdersScreen (screen_id: "campaign_orders")
//
// Назначение:
// - экран списка ордеров (Orders) для выбранной кампании/символа;
// - показывает уровни сетки (grid) и ордера (Market/Limit) по ним;
// - позволяет выполнять массовые действия по ордерам (Confirm Market / Open Limit / Cancel Limit);
// - даёт быстрый доступ к Rollover / Stop кампании.
// 
// Связь с Crypto-активом и режимом Sim/Live:
// - для каждого Crypto-актива в БД хранится поле trade_mode: "Sim" | "Live";
// - на этом экране trade_mode отбражается как цветной индикатор (зелёный = Live, красный = Sim);
// - логика Sim/Live полностью находится на бэкенде:
//     фронт всегда вызывает одни и те же API,
//     а бэкенд сам решает — отправлять ордера на биржу или в адаптер симуляции.
//
// API (Orders в контексте кампании):
// - GET  /api/campaigns/{campaign_id}/orders
//     Получить список ордеров и уровней для выбранной кампании.
// - POST /api/campaigns/{campaign_id}/orders/confirm-market
//     Выполнить ордера как рыночные (order_ids: [...]).
// - POST /api/campaigns/{campaign_id}/orders/open-limit
//     Открыть лимитные ордера (order_ids: [...]).
// - POST /api/campaigns/{campaign_id}/orders/cancel-limit
//     Отменить лимитные ордера (order_ids: [...]).

// Команды жизненного цикла кампании (делегируются на Campaigns):
// - POST /api/campaigns/{campaign_id}/rollover
// - POST /api/campaigns/{campaign_id}/stop

interface OrdersScreenProps {
  currentScreen: string;
}

const SCREENS = ["finance", "dashboard", "orders"];

// TODO API (Assets → trade_mode Sim/Live):
// Временный мок-список монет и их цвета.
// Здесь color используется как заглушка для индикации режима Sim/Live:
// - зелёный кружок   → Live (торговля идёт на биржу),
// - красный кружок   → Sim (работает симулятор).
//
// В реальной реализации:
// - список монет и их режимы должны приходить из бэкенда:
//   из таблицы assets (Crypto) через отдельный API или через /api/campaigns/{id}/orders;
// - color должен вычисляться из поля trade_mode Crypto-актива:
//     trade_mode = "Live" → зелёный цвет,
//     trade_mode = "Sim"  → красный цвет.
//
// Важно: фронт НИКОГДА не решает, Sim или Live — он только показывает индикатор.
// Логика выбора биржа/симулятор находится на бэкенде при обработке команд по ордерам.
const CRYPTO_COINS = [
  { name: "BTC", color: "red" },
  { name: "ETH", color: "green" },
  { name: "BNB", color: "green" },
  { name: "SOL", color: "red" },
  { name: "ADA", color: "green" },
  { name: "XRP", color: "red" }
];

// TODO API (Orders – mock data):
// Сейчас generateOrdersForTicker создаёт случайные ордера для демо UI.
// В реальной интеграции этот код нужно удалить:
// - список ордеров должен приходить из GET /api/campaigns/{campaign_id}/orders;
// - OrdersScreen не должен генерировать данные сам.
// 
// Здесь ticker используется как ключ для selectedCoin,
// а на уровне API должен быть campaign_id (кампания по этому символу).
const generateOrdersForTicker = (ticker: string) => {
  // ETHUSDC has no orders
  if (ticker === "ETH") return [];
  
  const orderCount = Math.floor(Math.random() * 8) + 3; // 3-10 orders
  const orders = [];
  
  const types = ["Market", "Limit"];
  const statuses = ["success", "pending", "active", "error"]; // filled, new, open, canceled
  const statusIcons = { success: Check, pending: Check, active: Check, error: X };
  
  for (let i = 0; i < orderCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const price = Math.floor(Math.random() * (120000 - 89000 + 1)) + 89000;
    
    orders.push({
      type,
      level: `Level ${i + 1}`,
      amount: `${price.toLocaleString('en-US').replace(/,/g, ' ')}$`,
      status,
      icon: statusIcons[status as keyof typeof statusIcons]
    });
  }
  
  return orders;
};

export default function OrdersScreen({ currentScreen }: OrdersScreenProps) {
  const { colors, toggleTheme, theme } = useTheme();
  const [expandedOrderIndex, setExpandedOrderIndex] = useState<number | null>(null);
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [isCoinDropdownOpen, setIsCoinDropdownOpen] = useState(false);
  const [isConfirmMarketSheetOpen, setIsConfirmMarketSheetOpen] = useState(false);
  const [isConfirmLimitSheetOpen, setIsConfirmLimitSheetOpen] = useState(false);
  const [isConfirmCancelSheetOpen, setIsConfirmCancelSheetOpen] = useState(false);
  const [isConfirmRolloverSheetOpen, setIsConfirmRolloverSheetOpen] = useState(false);
  const [isConfirmStopSheetOpen, setIsConfirmStopSheetOpen] = useState(false);
  
  // TODO API (Orders – загрузка с бэкенда):
  // В текущей реализации ordersMatrix — просто кэш мок-данных из generateOrdersForTicker().
  //
  // После интеграции с бэкендом:
  // - ordersMatrix здесь не нужен;
  // - вместо этого нужно хранить:
  //     * campaign_id для выбранного символа,
  //     * список ордеров из GET /api/campaigns/{campaign_id}/orders;
  // - логика Sim/Live по-прежнему на бэкенде:
  //     этот экран всегда обращается к одним и тем же API,
  //     а бэкенд по trade_mode решает, куда фактически отправлять ордера.
  const ordersMatrix = useMemo(() => {
    const matrix: Record<string, any[]> = {};
    CRYPTO_COINS.forEach(coin => {
      matrix[coin.name] = generateOrdersForTicker(coin.name);
    });
    return matrix;
  }, []);
  
  const [orders, setOrders] = useState(ordersMatrix[selectedCoin]);
  
  // Update orders when ticker changes
  useEffect(() => {
    setOrders(ordersMatrix[selectedCoin]);
    setExpandedOrderIndex(null);
  }, [selectedCoin, ordersMatrix]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "pending":
        return "bg-gray-400";
      case "active":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getButtonForOrder = (type: string, status: string) => {
    if (type === "Market") {
      if (status === "success") return null;
      if (status === "pending") return { text: "Confirm market buy order", variant: "gray" };
      return null;
    }
    
    if (type === "Limit") {
      if (status === "success") return null;
      if (status === "pending") return { text: "Open limit buy order", variant: "gray" };
      if (status === "active") return { text: "Cancel limit buy order", variant: "coral" };
      if (status === "error") return { text: "Open limit buy order", variant: "gray" };
    }
    
    return null;
  };

  const toggleOrder = (index: number) => {
    if (expandedOrderIndex === index) {
      setExpandedOrderIndex(null);
    } else {
      setExpandedOrderIndex(index);
    }
  };

  const handleButtonClick = (index: number, text: string) => {
    const newOrders = [...orders];
    
    if (text === "Confirm market buy order") {
      newOrders[index].status = "success";
      newOrders[index].icon = Check;
    } else if (text === "Open limit buy order") {
      newOrders[index].status = "active";
      newOrders[index].icon = Check;
    } else if (text === "Cancel limit buy order") {
      newOrders[index].status = "error";
      newOrders[index].icon = X;
    }
    
    setOrders(newOrders);
    setExpandedOrderIndex(null);
  };

  // TODO API (Orders – bulk actions):
  //
  // Сейчас bulk-хендлеры просто модифицируют локальный стейт и показывают toasts.
  // В реальной интеграции они должны:
  //
  // - собрать список order_ids для выбранных ордеров
  //   (например, все "Market + pending" для Confirm Market);
  // - вызвать один из эндпоинтов:
  //     Confirm Market → POST /api/campaigns/{campaign_id}/orders/confirm-market
  //     Open Limit    → POST /api/campaigns/{campaign_id}/orders/open-limit
  //     Cancel Limit  → POST /api/campaigns/{campaign_id}/orders/cancel-limit
  //   с телом: { order_ids: ["id1", "id2", ...] }
  //
  // Важное правило (Sim/Live):
  // - фронт не проверяет trade_mode и не знает, биржа это или симулятор;
  // - он просто вызывает нужный эндпоинт;
  // - бэкенд, опираясь на trade_mode связанного Crypto-актива/кампании,
  //   решает, отправлять ли ордера на биржу или в адаптер симуляции.
  //
  // После успешного ответа:
  // - обновить список ордеров (рефетч GET /api/campaigns/{campaign_id}/orders);
  // - показать toast об успехе.
  // В случае ошибки:
  // - показать toast/alert по error_code ( пока в UI только тоасты-заглушки ).
  const confirmAllMarket = () => {
    const newOrders = orders.map(order => {
      if (order.type === "Market" && order.status === "pending") {
        return { ...order, status: "success", icon: Check };
      }
      return order;
    });
    setOrders(newOrders);
    setExpandedOrderIndex(null);
  };
  
  const handleConfirmMarketSheet = () => {
    setIsConfirmMarketSheetOpen(true);
  };
  
  const handleConfirmMarketAction = () => {
    confirmAllMarket();
    setIsConfirmMarketSheetOpen(false);
  };

  const openAllLimit = () => {
    const newOrders = orders.map(order => {
      if (order.type === "Limit" && (order.status === "pending" || order.status === "error")) {
        return { ...order, status: "active", icon: Check };
      }
      return order;
    });
    setOrders(newOrders);
    setExpandedOrderIndex(null);
  };

  const handleOpenLimitSheet = () => {
    setIsConfirmLimitSheetOpen(true);
  };
  
  const handleOpenLimitAction = () => {
    openAllLimit();
    setIsConfirmLimitSheetOpen(false);
  };

  const cancelAllLimit = () => {
    const newOrders = orders.map(order => {
      if (order.type === "Limit" && order.status === "active") {
        return { ...order, status: "error", icon: X };
      }
      return order;
    });
    setOrders(newOrders);
    setExpandedOrderIndex(null);
  };

  const handleCancelLimitSheet = () => {
    setIsConfirmCancelSheetOpen(true);
  };
  
  const handleCancelLimitAction = () => {
    cancelAllLimit();
    setIsConfirmCancelSheetOpen(false);
  };

  // TODO API (Campaigns – Rollover / Stop):
  //
  // Сейчас handleRollover / handleStop только показывают тосты.
  // В реальной интеграции:
  // - handleConfirmRolloverAction должен вызывать POST /api/campaigns/{campaign_id}/rollover;
  // - handleConfirmStopAction     должен вызывать POST /api/campaigns/{campaign_id}/stop;
  //
  // Логика Sim/Live:
  // - режим кампании/актива (trade_mode) также учитывается только на бэкенде:
  //   * при Live: реальный стоп/ролловер на бирже;
  //   * при Sim: остановка/перестройка только в симуляторе.
  //
  // OrdersScreen только:
  // - показывает подтверждающую шторку,
  // - отправляет команду на бэкенд,
  // - отображает результат через toast.
  const handleRollover = () => {
    toast.success("Rollover успешно выполнен!", {
      description: "Все позиции продлены на следующий период",
      duration: 2000,
    });
  };

  const handleStop = () => {
    toast.error("Stop активирован!", {
      description: "Все активные ордера остановлены",
      duration: 2000,
    });
  };

  const handleConfirmRolloverSheet = () => {
    setIsConfirmRolloverSheetOpen(true);
  };
  
  const handleConfirmRolloverAction = () => {
    handleRollover();
    setIsConfirmRolloverSheetOpen(false);
  };

  const handleConfirmStopSheet = () => {
    setIsConfirmStopSheetOpen(true);
  };
  
  const handleConfirmStopAction = () => {
    handleStop();
    setIsConfirmStopSheetOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="pt-12 pb-2 px-4">
        {/* Screen Indicators */}
        <div className="flex justify-center gap-2 mb-3">
          {SCREENS.map((screen) => (
            <div
              key={screen}
              className={`w-2 h-2 rounded-full transition-all ${
                screen === currentScreen ? "w-6" : "opacity-30"
              }`}
              style={{ backgroundColor: theme === "green" ? "#10b981" : "#ef4444" }}
            />
          ))}
        </div>
      </div>

      {/* Trading Pair Toggle */}
      <div className="px-4 pt-4 pb-3">
        <div className="bg-white rounded-xl p-3 flex justify-between items-center">
          <div className="relative">
            <button
              onClick={() => setIsCoinDropdownOpen(!isCoinDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="font-bold text-[20px]">{selectedCoin}USDC</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isCoinDropdownOpen && (
              <div className="absolute top-12 left-0 bg-white rounded-lg shadow-lg z-10 min-w-[120px]">
                {CRYPTO_COINS.map((coin) => (
                  <button
                    key={coin.name}
                    onClick={() => {
                      setSelectedCoin(coin.name);
                      setIsCoinDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                      selectedCoin === coin.name ? 'bg-gray-100' : ''
                    }`}
                  >
                    {coin.name}USDC
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Trade mode indicator (Sim/Live):
              - зелёный кружок  → актив торгует в режиме Live (trade_mode = "Live");
              - красный кружок  → актив торгует в режиме Sim  (trade_mode = "Sim").
              
              Сейчас цвет берётся из CRYPTO_COINS[color] как заглушка.
              В реальной реализации:
              - color должен мапиться на поле trade_mode Crypto-актива из БД;
              - индикатор показывает пользователю режим,
                но не влияет на то, какой API будет вызван.
              
              Логика:
              - фронт ВСЕГДА вызыв��ет одни и те же эндпоинты /api/campaigns/{id}/orders/...;
              - бэкенд на своей стороне смотрит trade_mode
                и решает, слать ли ордера на биржу или в адаптер симуляции.
          */}
          {/* Color Indicator */}
          <div 
            className="w-6 h-6 rounded-full transition-all"
            style={{ 
              backgroundColor: CRYPTO_COINS.find(c => c.name === selectedCoin)?.color === 'green' ? '#10b981' : '#ef4444' 
            }}
          />
        </div>
      </div>

      {/* Orders List */}
      <div 
        className="flex-1 px-4 pb-2 overflow-y-auto" 
        data-scrollable="true"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))'
        }}
      >
        {orders.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full">
            <div className="text-[20px] text-gray-400 text-center">
              <div>No orders for {selectedCoin}USDC yet.</div>
              <div className="mt-2">Create a campaign on the campaigns screen.</div>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: colors.card }}>
              {orders.map((order, index) => {
                const Icon = order.icon;
                const button = getButtonForOrder(order.type, order.status);
                const isExpanded = expandedOrderIndex === index;
                
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleOrder(index)}
                      className="w-full flex items-center gap-4 px-4 py-2 border-b border-black/10 last:border-b-0"
                    >
                      <div className={`w-8 h-8 ${getStatusColor(order.status)} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-[16px]">{order.type}</div>
                        <div className="text-sm opacity-60 text-[16px]">{order.level}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-black font-normal text-[16px]">{order.amount}</span>
                        <ChevronRight className="w-5 h-5 opacity-30" />
                        <span className="opacity-30 text-[16px]">12.00$</span>
                      </div>
                    </button>
                    
                    {/* Action Button */}
                    {button && isExpanded && (
                      <div className="px-6 pt-2 pb-3 border-b border-black/10">
                        <button
                          onClick={() => handleButtonClick(index, button.text)}
                          className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
                            button.variant === "coral"
                              ? "bg-[#ff6b6b] text-white"
                              : button.text === "Open limit buy order"
                              ? "bg-blue-500 text-white"
                              : "bg-green-500 text-white"
                          }`}
                          style={{
                            fontWeight: 500,
                          }}
                        >
                          {button.variant === "coral" && (
                            <Trash2 className="w-5 h-5" />
                          )}
                          {button.text}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bulk Action Buttons */}
            {orders.length > 0 && (
              <>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleConfirmMarketSheet}
                    className="flex-1 py-3 rounded-2xl bg-green-500 text-white flex items-center justify-center gap-2 transition-all text-sm"
                    style={{
                      fontWeight: 500,
                    }}
                  >
                    Confirm Market
                  </button>

                  <button
                    onClick={handleOpenLimitSheet}
                    className="flex-1 py-3 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 transition-all text-sm"
                    style={{
                      fontWeight: 500,
                    }}
                  >
                    Open Limit
                  </button>

                  <button
                    onClick={handleCancelLimitSheet}
                    className="flex-1 py-3 rounded-2xl bg-[#ff6b6b] text-white flex items-center justify-center gap-2 transition-all text-sm"
                    style={{
                      fontWeight: 500,
                    }}
                  >
                    Cancel Limit
                  </button>
                </div>

                {/* Rollover and Stop Buttons */}
                <div 
                  className="mt-2 flex gap-2" 
                  style={{ 
                    marginBottom: 'max(10rem, calc(env(safe-area-inset-bottom) + 8rem))' 
                  }}
                >
                  <button
                    onClick={handleConfirmRolloverSheet}
                    className="flex-1 py-3 rounded-2xl bg-gray-400 text-white flex items-center justify-center gap-2 transition-all text-sm"
                    style={{
                      fontWeight: 500,
                    }}
                  >
                    Rollover
                  </button>

                  <button
                    onClick={handleConfirmStopSheet}
                    className="flex-1 py-3 rounded-2xl bg-gray-400 text-white flex items-center justify-center gap-2 transition-all text-sm"
                    style={{
                      fontWeight: 500,
                    }}
                  >
                    Stop
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Confirm Market Sheet */}
      <ConfirmMarketSheet
        isOpen={isConfirmMarketSheetOpen}
        onClose={() => setIsConfirmMarketSheetOpen(false)}
        onConfirm={handleConfirmMarketAction}
        pendingCount={orders.filter(o => o.type === "Market" && o.status === "pending").length}
      />
      
      {/* Confirm Limit Sheet */}
      <ConfirmLimitSheet
        isOpen={isConfirmLimitSheetOpen}
        onClose={() => setIsConfirmLimitSheetOpen(false)}
        onConfirm={handleOpenLimitAction}
        pendingCount={orders.filter(o => o.type === "Limit" && (o.status === "pending" || o.status === "error")).length}
      />
      
      {/* Confirm Cancel Sheet */}
      <ConfirmCancelSheet
        isOpen={isConfirmCancelSheetOpen}
        onClose={() => setIsConfirmCancelSheetOpen(false)}
        onConfirm={handleCancelLimitAction}
        activeCount={orders.filter(o => o.type === "Limit" && o.status === "active").length}
      />
      
      {/* Confirm Rollover Sheet */}
      <ConfirmRolloverSheet
        isOpen={isConfirmRolloverSheetOpen}
        onClose={() => setIsConfirmRolloverSheetOpen(false)}
        onConfirm={handleConfirmRolloverAction}
      />
      
      {/* Confirm Stop Sheet */}
      <ConfirmStopSheet
        isOpen={isConfirmStopSheetOpen}
        onClose={() => setIsConfirmStopSheetOpen(false)}
        onConfirm={handleConfirmStopAction}
      />
    </div>
  );
}