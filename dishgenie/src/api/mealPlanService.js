import { fetchJson } from "./apiClient";

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function weekStartParam(date) {
  const d = new Date(date);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return iso;
}

export async function getWeekPlan(isoWeek) {
  return fetchJson(`/api/meal-plans?week=${isoWeek}`);
}

export async function setSlot(isoWeek, day, mealType, recipeId) {
  return fetchJson(`/api/meal-plans/${isoWeek}`, {
    method: "PUT",
    body: JSON.stringify({ day, mealType, recipeId })
  });
}

export async function clearSlot(isoWeek, day, mealType) {
  return fetchJson(`/api/meal-plans/${isoWeek}/${day}/${mealType}`, {
    method: "DELETE"
  });
}
