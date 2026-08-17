import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { sendChat } from "../api/aiService";
import { getRecipeById } from "../api/mealService";

const SUGGESTIONS = [
  "What can I cook for dinner tonight?",
  "Give me a high-protein vegetarian recipe",
  "Suggest a quick breakfast for a busy morning",
  "What can I make with chicken and rice?"
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const [searchParams] = useSearchParams();
  const autoSent = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Auto-ask when arriving from a recipe detail page (?recipe=<id>) */
  useEffect(() => {
    const recipeId = searchParams.get("recipe");
    if (!recipeId || autoSent.current) return;
    autoSent.current = true;
    (async () => {
      let name = "this recipe";
      try {
        const r = await getRecipeById(recipeId);
        if (r && r.name) name = r.name;
      } catch {
        /* keep generic name */
      }
      handleSend(`Help me cook ${name}. What should I know?`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const resolveNames = async (recipeIds) => {
    const names = await Promise.all(
      (recipeIds || []).map(async (id) => {
        try {
          const r = await getRecipeById(id);
          return { id, name: r.name || "Recipe" };
        } catch {
          return { id, name: "Recipe" };
        }
      })
    );
    return names;
  };

  const handleSend = async (text) => {
    const message = String(text ?? input).trim();
    if (!message || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setSending(true);
    try {
      const data = await sendChat(message);
      // Prefer the structured, MongoDB-backed recipes returned by the backend.
      // Fall back to resolving ids only for older server responses.
      const recipes =
        data.recipes && data.recipes.length > 0
          ? data.recipes.map((r) => ({ id: r.id, name: r.name || "Recipe" }))
          : await resolveNames(data.recipeIds);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply, recipes, mode: data.mode }
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `⚠️ ${err.message || "Something went wrong."}`, recipes: [] }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-container ai-page">
      <h2>🤖 AI Recipe Assistant</h2>
      <p className="page-subtitle">
        Ask for ideas, substitutions or meal suggestions. Your questions are answered using your preferences.
      </p>

      {messages.length === 0 && (
        <div className="ai-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => handleSend(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            {msg.role === "assistant" && msg.mode && (
              <span className={`mode-badge ${msg.mode}`}>
                {msg.mode === "offline" ? "📚 Database" : "✨ AI"}
              </span>
            )}
            <div className="chat-text">{msg.text}</div>
            {msg.recipes && msg.recipes.length > 0 && (
              <div className="chat-recipes">
                {msg.recipes.map((r) => (
                  <Link to={`/recipe/${r.id}`} key={r.id} className="chat-recipe-chip">
                    🍽️ {r.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <div className="chat-msg assistant typing">… thinking</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask DishGenie about food, recipes, or meal ideas..."
          disabled={sending}
        />
        <button onClick={() => handleSend()} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
