import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Message } from '../services/api';
import { getMessages } from '../services/api';
import { setApiMessages, clearApiMessages, setResolverMode } from '../messages/messageResolver';
import { useDataSource } from './DataSourceContext';

interface MessagesContextType {
  messages: Message[];
  isLoading: boolean;
  reload: () => Promise<void>;
  refreshMessages: (options?: { force?: boolean }) => Promise<void>;
  updateMessageCache: (message: Message) => void;
  deleteMessageCache: (code: string) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

const CACHE_KEY = 'app_messages_cache';
const CACHE_TIMESTAMP_KEY = 'app_messages_cache_timestamp';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { mode } = useDataSource();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load messages from cache
   */
  const loadFromCache = (): Message[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) return null;
      
      const age = Date.now() - parseInt(timestamp);
      if (age > CACHE_TTL) {
        // Cache expired
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        return null;
      }
      
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  /**
   * Save messages to cache
   */
  const saveToCache = (msgs: Message[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(msgs));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // Ignore cache errors
    }
  };

  /**
   * Load messages from API
   */
  const loadMessages = async () => {
    if (mode === 'MOCK') {
      // ⚠️ STRICT RULE: In MOCK mode, NEVER use API catalog
      // Clear everything and set resolver to MOCK mode
      clearApiMessages();
      setResolverMode('MOCK');
      setMessages([]);
      return;
    }

    // Set resolver to API mode
    setResolverMode('API');

    setIsLoading(true);
    try {
      // Try cache first (only in API mode)
      const cached = loadFromCache();
      if (cached) {
        setMessages(cached);
        setApiMessages(cached);
        setIsLoading(false);
        return;
      }

      // Load from API
      const items = await getMessages(); // Returns Message[]
      
      // Validate array (extra safety check)
      if (!Array.isArray(items)) {
        console.error('getMessages() did not return an array:', items);
        return;
      }
      
      setMessages(items);
      setApiMessages(items);
      saveToCache(items);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Try cache as fallback
      const cached = loadFromCache();
      if (cached) {
        setMessages(cached);
        setApiMessages(cached);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reload messages (force refresh)
   */
  const reload = async () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    await loadMessages();
  };

  /**
   * Refresh messages with optional force flag
   * 
   * @param options.force - If true, always fetch from API (ignoring cache/TTL)
   * 
   * Usage:
   * - refreshMessages() → Uses cache if valid
   * - refreshMessages({ force: true }) → Always fetches from API
   */
  const refreshMessages = async (options?: { force?: boolean }) => {
    // In MOCK mode, do nothing
    if (mode === 'MOCK') {
      return;
    }

    // Force refresh: ignore cache and TTL
    if (options?.force) {
      setResolverMode('API');
      setIsLoading(true);
      
      try {
        // Always fetch from API
        const items = await getMessages();
        
        if (!Array.isArray(items)) {
          console.error('getMessages() did not return an array:', items);
          return;
        }
        
        // Update state and cache
        setMessages(items);
        setApiMessages(items);
        saveToCache(items); // ← Overwrites cache with fresh data
      } catch (error) {
        console.error('Failed to refresh messages:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Normal refresh: use existing loadMessages logic
      await loadMessages();
    }
  };

  /**
   * Update message in cache (after successful PUT)
   */
  const updateMessageCache = (message: Message) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.code === message.code);
      let updated: Message[];
      
      if (index >= 0) {
        // Update existing
        updated = [...prev];
        updated[index] = message;
      } else {
        // Add new
        updated = [...prev, message];
      }
      
      // Update API messages map and cache
      setApiMessages(updated);
      saveToCache(updated);
      
      return updated;
    });
  };

  /**
   * Delete message from cache (after successful DELETE)
   */
  const deleteMessageCache = (code: string) => {
    setMessages((prev) => {
      const updated = prev.filter((m) => m.code !== code);
      
      // Update API messages map and cache
      setApiMessages(updated);
      saveToCache(updated);
      
      return updated;
    });
  };

  /**
   * Load messages when mode changes
   */
  useEffect(() => {
    loadMessages();
  }, [mode]);

  return (
    <MessagesContext.Provider value={{ 
      messages, 
      isLoading, 
      reload,
      refreshMessages,
      updateMessageCache,
      deleteMessageCache
    }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return context;
}