import { Check, X, ChevronRight, Trash2, ChevronDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

interface OrdersScreenNewProps {
  currentScreen: string;
}

const SCREENS = ["finance", "dashboard", "orders"];
const CRYPTO_COINS = ["BTC", "ETH", "BNB"];

export default function OrdersScreen({ currentScreen }: OrdersScreenNewProps) {
  const { colors, toggleTheme, theme } = useTheme();
  const [expandedOrderIndex, setExpandedOrderIndex] = useState<number | null>(null);
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [isCoinDropdownOpen, setIsCoinDropdownOpen] = useState(false);
  
  const [orders, setOrders] = useState([
    { type: "Market", level: "Level 1", amount: "129 389$", status: "success", icon: Check },
    { type: "Market", level: "Level 2", amount: "129 389$", status: "pending", icon: Check },
    { type: "Limit", level: "Level 3", amount: "129 389$", status: "pending", icon: Check },
    { type: "Limit", level: "Level 4", amount: "129 389$", status: "active", icon: Check },
    { type: "Limit", level: "Level 5", amount: "129 389$", status: "error", icon: X },
    { type: "Market", level: "Level 6", amount: "129 389$", status: "pending", icon: Check },
  ]);

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

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="pt-12 pb-4 px-4" style={{ backgroundColor: colors.primary }}>
        {/* Screen Indicators */}
        <div className="flex justify-center gap-2 mb-3">
          {SCREENS.map((screen) => (
            <div
              key={screen}
              className={`w-2 h-2 rounded-full transition-all ${
                screen === currentScreen ? "bg-black w-6" : "bg-black/30"
              }`}
            />
          ))}
        </div>
        <div className="text-center text-[24px] font-bold">Orders</div>
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
                    key={coin}
                    onClick={() => {
                      setSelectedCoin(coin);
                      setIsCoinDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                      selectedCoin === coin ? 'bg-gray-100' : ''
                    }`}
                  >
                    {coin}USDC
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className="relative inline-block w-14 h-8"
          >
            <div
              className="rounded-full w-full h-full flex items-center px-1 transition-all"
              style={{
                backgroundColor: colors.primary,
                justifyContent: theme === "green" ? "flex-end" : "flex-start",
              }}
            >
              <div className="w-6 h-6 bg-white rounded-full transition-all" />
            </div>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 px-4 pb-2 overflow-y-auto">
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
        <div className="mt-2 flex gap-2">
          <button
            onClick={confirmAllMarket}
            className="flex-1 py-3 rounded-2xl bg-green-500 text-white flex items-center justify-center gap-2 transition-all text-sm"
            style={{
              fontWeight: 500,
            }}
          >
            Confirm Market
          </button>

          <button
            onClick={openAllLimit}
            className="flex-1 py-3 rounded-2xl bg-blue-500 text-white flex items-center justify-center gap-2 transition-all text-sm"
            style={{
              fontWeight: 500,
            }}
          >
            Open Limit
          </button>

          <button
            onClick={cancelAllLimit}
            className="flex-1 py-3 rounded-2xl bg-[#ff6b6b] text-white flex items-center justify-center gap-2 transition-all text-sm"
            style={{
              fontWeight: 500,
            }}
          >
            Cancel Limit
          </button>
        </div>

        {/* Rollover and Stop Buttons */}
        <div className="mt-2 flex gap-2 mb-16">
          <button
            className="flex-1 py-3 rounded-2xl bg-gray-400 text-white flex items-center justify-center gap-2 transition-all text-sm"
            style={{
              fontWeight: 500,
            }}
          >
            Rollover
          </button>

          <button
            className="flex-1 py-3 rounded-2xl bg-gray-400 text-white flex items-center justify-center gap-2 transition-all text-sm"
            style={{
              fontWeight: 500,
            }}
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}