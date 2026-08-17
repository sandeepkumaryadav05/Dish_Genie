import { fetchJson, qs } from "./apiClient";

export async function fetchByIngredient(ingredient, { limit = 50, veg, nutrition } = {}) {
  const query = qs({
    ingredients: ingredient ? [ingredient] : [],
    isVeg: veg,
    nutrition,
    limit
  });

  const data = await fetchJson(`/api/recipes?${query}`);
  return data.items || [];
}

export async function getRandomMeals({ count = 1, veg } = {}) {
  const query = qs({ count, veg });
  const data = await fetchJson(`/api/recipes/random?${query}`);
  return data || [];
}

export async function getRecipeById(id) {
  return fetchJson(`/api/recipes/${id}`);
}

export async function getRecipesByIngredient(ingredients, { veg, nutrition } = {}) {
  const list = String(ingredients || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (list.length === 0) return [];

  const vegFlag = typeof veg === "boolean" ? veg : undefined;

  const applyVegFilter = (arr = []) =>
    arr.filter(r => r && r._id && r.name)
      .filter(r => (vegFlag === undefined)
        ? true
        : (r.isVeg === vegFlag)
      );

  const strictQ = qs({ ingredients: list, veg: vegFlag, nutrition, limit: 60 });
  let strictResult;

  try {
    strictResult = await fetchJson(`/api/recipes?${strictQ}`);
  } catch {
    strictResult = { items: [] };
  }

  const strictItems = applyVegFilter(strictResult.items || []);

  if (strictItems.length) return strictItems;

  const buckets = await Promise.all(
    list.map(ing =>
      fetchByIngredient(ing, { veg: vegFlag, nutrition, limit: 50 }).catch(() => [])
    )
  );

  const flat = buckets.flat().filter(Boolean);

  if (!flat.length) return [];

  const vegFiltered = applyVegFilter(flat);

  if (!vegFiltered.length) return [];

  const containsAllIngredients = (recipe) => {
    const names = (recipe.ingredients || [])
      .map(i => String(i.name || "").toLowerCase());

    return list.every(searchIng =>
      names.some(n => n.includes(searchIng))
    );
  };

  const actualMatches = vegFiltered.filter(containsAllIngredients);

  if (actualMatches.length) return actualMatches;

  return [];
}
