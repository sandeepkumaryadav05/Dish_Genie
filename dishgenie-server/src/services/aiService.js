// AI provider abstraction.
//
// Uses the Google Gemini API (native :generateContent endpoint) by default.
// Override the endpoint with AI_BASE_URL and the model with AI_MODEL.
// If AI_API_KEY is not configured, a local, database-driven fallback answers
// from the recipe database so the assistant still works offline.
//
// MongoDB is the source of truth for recipe recommendations. The AI is the
// conversational/reasoning layer only: it receives the top MongoDB candidates
// (already filtered, ranked and scored) and explains them in natural language.
// Every `recipeIds` entry is filtered against the supplied real documents so a
// hallucinated recipe can never be surfaced as a database recommendation.
//
// The provider is intentionally isolated: swap in a different provider by
// replacing this module and keeping the same `chat({ message, recipes, user })`
// contract.

const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta')
  .replace(/\/+$/, '');
const AI_MODEL = process.env.AI_MODEL || 'gemini-3.6-flash';
const AI_API_KEY = process.env.AI_API_KEY || '';

const SYSTEM_PROMPT = `You are DishGenie AI, a friendly, helpful recipe assistant
that helps users cook with the ingredients they have.

DATABASE GROUNDING RULES (most important):
1. The "DATABASE RECIPES" section below contains the ONLY recipes available in
   the user's DishGenie database. Recommend recipes ONLY from that section.
   When you recommend one, use its exact details and include its id from the
   section in the "recipeIds" array.
2. NEVER invent or fabricate a recipe. NEVER claim a recipe exists in the
   DishGenie database unless it is listed in "DATABASE RECIPES".
3. If the user asks about a specific recipe that is NOT in "DATABASE RECIPES",
   clearly say you could not find that recipe in the DishGenie database, and
   suggest the closest real database recipes instead (if any).
4. You may still answer general cooking questions (substitutions, technique,
   nutrition, meal ideas) from your general knowledge, but clearly label such
   advice as general cooking knowledge — NOT as a DishGenie database recipe.
5. If no database recipe fits, say so naturally ("I couldn't find a recipe in
   DishGenie's database that matches all of those requirements...") and offer
   the closest matches from the list. Do not invent a recipe to fill the gap.

FACTS:
- Nutrition values in the database recipes are estimates (marked "(estimated)"
  per serving). Always describe them as approximate/estimated.
- Only use the ingredient, cooking time, difficulty, servings and nutrition
  values that are actually listed for each database recipe. Do not invent or
  guess values that are missing.

STYLE:
- Be concise, warm and practical. Use bullet points and short paragraphs.

Respond with STRICT JSON in this exact shape:
{
  "reply": "your answer text",
  "recipeIds": ["<ids of real database recipes from the DATABASE RECIPES section that you mentioned, if any>"]
}`;

function describeUser(user) {
  if (!user) return '';
  const p = user.preferences || {};
  const parts = [];
  if (p.diet && p.diet !== 'any') parts.push(`Diet: ${p.diet}`);
  if (p.favoriteCuisines && p.favoriteCuisines.length)
    parts.push(`Favorite cuisines: ${p.favoriteCuisines.join(', ')}`);
  if (p.favoriteIngredients && p.favoriteIngredients.length)
    parts.push(`Likes ingredients: ${p.favoriteIngredients.join(', ')}`);
  if (p.dislikedIngredients && p.dislikedIngredients.length)
    parts.push(`Avoids ingredients: ${p.dislikedIngredients.join(', ')}`);
  if (p.mealTypes && p.mealTypes.length)
    parts.push(`Prefers meals: ${p.mealTypes.join(', ')}`);
  if (p.maxCookingTime)
    parts.push(`Max cooking time: ${p.maxCookingTime} minutes`);
  if (p.difficulty && p.difficulty !== 'any')
    parts.push(`Difficulty: ${p.difficulty}`);
  if (p.nutritionGoal && p.nutritionGoal !== 'balanced')
    parts.push(`Nutrition goal: ${p.nutritionGoal}`);
  if (user.activity && user.activity.favoriteRecipeIds && user.activity.favoriteRecipeIds.length)
    parts.push(`Favorite recipe ids: ${user.activity.favoriteRecipeIds.join(', ')}`);
  return parts.length ? `USER PROFILE:\n${parts.join('\n')}` : '';
}

// Accepts either raw recipe docs or ranked { recipe, score, reasons } entries
// returned by the recommendation service.
function asDocs(recipes = []) {
  return recipes
    .map((r) => {
      if (r && r.recipe && r.recipe._id) {
        return {
          ...r.recipe,
          _aiScore: r.score,
          _aiReasons: r.reasons
        };
      }
      return r;
    })
    .filter((r) => r && r._id);
}

function compactRecipes(recipes = []) {
  const docs = asDocs(recipes);
  if (!docs.length) return 'DATABASE RECIPES: none found';
  const lines = docs.map((r) => {
    const n = r.nutrition || {};
    const nutrition = n.calories != null
      ? `${n.calories} kcal, protein ${n.protein ?? '?'}g, carbs ${n.carbohydrates ?? '?'}g, fat ${n.fat ?? '?'}g, fiber ${n.fiber ?? '?'}g, sugar ${n.sugar ?? '?'}g, sodium ${n.sodium ?? '?'}mg (per serving${n.estimated ? ', estimated' : ''})`
      : 'nutrition unknown';
    const time = r.cookingTime ? `${r.cookingTime} min` : 'time unknown';
    const servings = r.servings ? `, serves ${r.servings}` : '';
    const relevance = r._aiScore != null
      ? ` | relevance: ${r._aiScore}/100${r._aiReasons && r._aiReasons.length ? ` (${r._aiReasons.join('; ')})` : ''}`
      : '';
    return `- [${r._id}] ${r.name} (${r.area || 'Global'}, ${r.category || 'uncategorized'}, ${r.isVeg ? 'veg' : 'non-veg'}, ${time}${servings}, difficulty: ${r.difficulty || 'unknown'}) ingredients: ${(r.ingredients || []).map((i) => i.name).join(', ')}; ${nutrition}${relevance}`;
  });
  return `DATABASE RECIPES:\n${lines.join('\n')}`;
}

function buildMessages({ message, recipes, user }) {
  const userBlock = describeUser(user);
  const recipesBlock = compactRecipes(recipes);
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${userBlock ? userBlock + '\n\n' : ''}${recipesBlock}\n\nUSER QUESTION:\n${message}`
    }
  ];
}

async function callAI(messages) {
  const system = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const body = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  };
  if (system) body.systemInstruction = { parts: [{ text: system.content }] };

  const res = await fetch(`${AI_BASE_URL}/models/${AI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': AI_API_KEY
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`AI provider error ${res.status}`);
  }
  const data = await res.json();
  const content = data.candidates && data.candidates[0] && data.candidates[0].content
    ? (data.candidates[0].content.parts || []).map((p) => p.text || '').join('')
    : '';
  return content;
}

function parseAiJson(content) {
  if (!content) return null;
  let parsed = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }

  // Gemini sometimes double-encodes the JSON object as a string inside
  // "reply". Unwrap it so users never see raw JSON in the chat window.
  if (parsed && typeof parsed.reply === 'string') {
    const inner = parsed.reply.trim();
    if (inner.startsWith('{') || inner.startsWith('[')) {
      try {
        const nested = JSON.parse(inner);
        if (nested && typeof nested.reply === 'string') {
          parsed = {
            reply: nested.reply,
            recipeIds: nested.recipeIds ?? parsed.recipeIds
          };
        }
      } catch {
        /* not actually nested JSON — keep the outer value */
      }
    }
  }

  return parsed;
}

/* ------------------------------------------------------------------ */
/* Structured recipe reference (real MongoDB ids only)                 */
/* ------------------------------------------------------------------ */
function toRecipeSummary(recipe) {
  const n = recipe.nutrition || {};
  return {
    id: String(recipe._id),
    name: recipe.name,
    slug: recipe.slug || '',
    thumbnail: recipe.thumbnail || '',
    cookingTime: recipe.cookingTime ?? null,
    difficulty: recipe.difficulty || '',
    servings: recipe.servings ?? null,
    area: recipe.area || '',
    category: recipe.category || '',
    isVeg: !!recipe.isVeg,
    nutrition: {
      calories: n.calories ?? null,
      protein: n.protein ?? null,
      carbohydrates: n.carbohydrates ?? null,
      fat: n.fat ?? null,
      fiber: n.fiber ?? null,
      sugar: n.sugar ?? null,
      sodium: n.sodium ?? null,
      estimated: !!n.estimated,
      perServing: !!n.perServing
    }
  };
}

// Build { recipeIds, recipes } from a list of ids, keeping ONLY ids that exist
// in the supplied real documents. This is the anti-hallucination guard.
function resolveRecipeReferences(recipeIds, recipes) {
  const docs = asDocs(recipes);
  const byId = new Map(docs.map((r) => [String(r._id), r]));

  const valid = [];
  const seen = new Set();
  for (const raw of Array.isArray(recipeIds) ? recipeIds : []) {
    const id = String(raw);
    if (!id || seen.has(id)) continue;
    const doc = byId.get(id);
    if (!doc) continue; // not a real candidate — drop it
    seen.add(id);
    valid.push(doc);
  }
  return {
    recipeIds: valid.map((r) => String(r._id)),
    recipes: valid.map(toRecipeSummary)
  };
}

function topMatches(recipes, limit = 5) {
  return asDocs(recipes).slice(0, limit);
}

function localFallbackReply({ message, recipes }) {
  const matches = topMatches(recipes, 5);
  const refs = resolveRecipeReferences(matches.map((r) => r._id), matches);

  if (!matches.length) {
    return {
      reply:
        'I could not find a recipe in the DishGenie database that matches that. ' +
        'Try telling me the ingredients you have, a meal type (breakfast, lunch, ' +
        'dinner), a cuisine, or a nutrition goal (for example "high-protein under ' +
        '500 calories") — I will search the database again.',
      recipeIds: [],
      recipes: [],
      mode: 'offline'
    };
  }

  const lines = matches.map((r, i) => {
    const n = r.nutrition || {};
    const nutrition = n.calories != null
      ? ` (~${n.calories} kcal, ${n.protein ?? '?'}g protein per serving, estimated)`
      : '';
    const time = r.cookingTime ? `, ready in ~${r.cookingTime} min` : '';
    const tag = r.isVeg ? '🌱 Vegetarian' : '🍗 Non-veg';
    return `${i + 1}. **${r.name}** — ${r.category || 'Recipe'} (${r.area || 'Global'}) · ${tag}${time}${nutrition}`;
  });

  return {
    reply:
      `Here are recipes from the DishGenie database that best match your request:\n\n` +
      lines.join('\n') +
      '\n\nTap any recipe to open it. Tip: save your food preferences to get ' +
      'even better suggestions.',
    recipeIds: refs.recipeIds,
    recipes: refs.recipes,
    mode: 'offline'
  };
}

/**
 * Main entry point.
 * Returns { reply, recipeIds, recipes, mode: 'ai' | 'offline' }.
 * `recipes` is an array of structured references backed by real MongoDB ids.
 */
async function chat({ message, recipes, user }) {
  if (!AI_API_KEY) {
    return localFallbackReply({ message, recipes });
  }

  try {
    const messages = buildMessages({ message, recipes, user });
    const content = await callAI(messages);
    const parsed = parseAiJson(content);

    if (parsed && typeof parsed.reply === 'string') {
      const refs = resolveRecipeReferences(parsed.recipeIds, recipes);
      return {
        reply: parsed.reply,
        recipeIds: refs.recipeIds,
        recipes: refs.recipes,
        mode: 'ai'
      };
    }

    // Model didn't follow the JSON contract — surface its raw text.
    return {
      reply: content || 'Sorry, I could not generate an answer.',
      recipeIds: [],
      recipes: [],
      mode: 'ai'
    };
  } catch (err) {
    console.error('AI provider call failed:', err.message);
    // If the provider fails, gracefully degrade to the database fallback.
    const fallback = localFallbackReply({ message, recipes });
    return {
      ...fallback,
      reply:
        fallback.reply +
        '\n\n_(The AI service is temporarily unavailable, so I answered using ' +
        'the DishGenie database only.)_',
      mode: 'offline'
    };
  }
}

module.exports = { chat };
