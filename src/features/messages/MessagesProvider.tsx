import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { fetchMessageSummary } from "../../lib/api/messages";
import type { MessageItem } from "../../types/messages";

type MessagesContextValue = {
  latest: MessageItem[];
  total: number;
  unread: number;
  isLoading: boolean;
  refreshSummary: () => Promise<void>;
  resetSummary: () => void;
};

const MessagesContext = createContext<MessagesContextValue | undefined>(
  undefined,
);

const SUMMARY_REFRESH_INTERVAL_MS = 60 * 1000;

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { status, isAuthenticated } = useAuth();
  const [latest, setLatest] = useState<MessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const resetSummary = () => {
    setLatest([]);
    setTotal(0);
    setUnread(0);
    setIsLoading(false);
  };

  const refreshSummary = async () => {
    if (!isAuthenticated) {
      resetSummary();
      return;
    }

    setIsLoading(true);
    try {
      const summary = await fetchMessageSummary();
      setLatest(summary.latest);
      setTotal(summary.total);
      setUnread(summary.unread);
    } catch {
      setLatest([]);
      setTotal(0);
      setUnread(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!isAuthenticated) {
      resetSummary();
      return;
    }

    void refreshSummary();

    const intervalId = window.setInterval(() => {
      void refreshSummary();
    }, SUMMARY_REFRESH_INTERVAL_MS);

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        void refreshSummary();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [isAuthenticated, status]);

  const value = useMemo(
    () => ({
      latest,
      total,
      unread,
      isLoading,
      refreshSummary,
      resetSummary,
    }),
    [isLoading, latest, total, unread],
  );

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);

  if (!context) {
    throw new Error("useMessages must be used within MessagesProvider.");
  }

  return context;
}
