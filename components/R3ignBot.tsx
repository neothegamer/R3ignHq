"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type BotMessage = { id: number; role: "user" | "bot"; text: string };
type BotContextValue = { openBot: () => void };

const BotContext = createContext<BotContextValue | null>(null);

async function sendMessageToBot(_message: string): Promise<string> {
  // Replace this placeholder with the R3IGN bot service when its API exists.
  return "The R3IGN Bot is being connected. Please check back soon.";
}

export function R3ignBotTrigger({
  className = "",
}: {
  className?: string;
}) {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error("R3ignBotTrigger must be used within R3ignBotProvider");
  }

  return (
    <button
      type="button"
      className={className}
      aria-label="Open R3IGN Bot"
      onClick={context.openBot}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </svg>
      <span>R3IGN Bot</span>
    </button>
  );
}

export default function R3ignBotProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const nextId = useRef(0);

  const openBot = useCallback(() => setOpen(true), []);
  const closeBot = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBot();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !panelRef.current?.contains(target)) {
        closeBot();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, closeBot]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((items) => [
      ...items,
      { id: nextId.current++, role: "user", text },
    ]);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendMessageToBot(text);
      setMessages((items) => [
        ...items,
        { id: nextId.current++, role: "bot", text: reply },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          id: nextId.current++,
          role: "bot",
          text: "The bot could not respond. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BotContext.Provider value={{ openBot }}>
      {children}
      <button
        type="button"
        className="assistant-launcher r3ign-bot-fab"
        aria-label="Open R3IGN Bot"
        aria-expanded={open}
        onClick={openBot}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        </svg>
      </button>
      <section
        ref={panelRef}
        className={`assistant-panel r3ign-bot-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="r3ign-bot-title"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="assistant-head">
          <div>
            <h2 id="r3ign-bot-title">R3IGN Bot</h2>
            <p>League assistant · Preview</p>
          </div>
          <button
            type="button"
            className="assistant-close"
            aria-label="Close R3IGN Bot"
            onClick={closeBot}
          >
            ×
          </button>
        </div>
        <div className="assistant-body" aria-live="polite">
          {messages.length === 0 ? (
            <p className="assistant-msg bot">
              Welcome to R3IGN HQ. The bot connection is not live yet, but you
              can try sending a message.
            </p>
          ) : (
            messages.map((message) => (
              <p
                key={message.id}
                className={`assistant-msg ${message.role}`}
              >
                {message.text}
              </p>
            ))
          )}
          {loading && (
            <p className="assistant-msg bot" role="status">
              Connecting to the R3IGN Bot…
            </p>
          )}
        </div>
        <form className="assistant-form" onSubmit={submitMessage}>
          <label className="sr-only" htmlFor="r3ign-bot-input">
            Message the R3IGN Bot
          </label>
          <input
            id="r3ign-bot-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask R3IGN Bot…"
            maxLength={1000}
          />
          <button type="submit" aria-label="Send message" disabled={loading}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
      </section>
    </BotContext.Provider>
  );
}
