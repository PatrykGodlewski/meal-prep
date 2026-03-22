# Figma Design Prompt: Dieting & Weekly Meal Planning App

**Max 5000 chars – copy the block below into Figma AI / v0 / Galileo.**

---

## Prompt (~2650 chars)

```
Design a comprehensive dieting and weekly meal planning web app. Desktop-first, mobile-responsive. Use shadcn/ui–compatible design system: semantic tokens (background, foreground, primary, muted, accent, card, destructive), light/dark mode, neutral palette, rounded 0.5–0.75rem, clean sans-serif. Professional, health-focused aesthetic.

LAYOUT: Collapsible sidebar (16rem expanded, icons when collapsed): logo, Quick Create Meal CTA, nav (Meal Planner, My Fridge, Meals, Meal Plans, Ingredients), Settings/Search, user avatar at bottom. Main content max-width ~1400px, padded.

MEAL PLANNER (home): Header with week nav (prev/next), “Week of [date]”, Generate plan / Generate with ingredients I have. 7-column grid (Mon–Sun). Each day card: date + day name, lock/unlock, meal slots (Breakfast, Lunch, Dinner, Snack, Dessert, Drinks) with + to add meal, kcal progress (X/Y consumed), Add extra. Empty days: dashed card “Not created”.

SHOPPING LIST: Header (serving size, date range, Hide checked toggle). List grouped by category (Grain, Fruit, Vegetable, Meat, Dairy…). Items: checkbox (checked=strikethrough), name, amount+unit; collapsible “For meals” breakdown; yellow highlight if partial amount. Empty: “Your shopping list is empty”.

MEALS LIBRARY: Search, filters. Grid meal cards: image or placeholder, category badge, heart (favourite), title, description; meta (clock, servings, flame); author+date. Pagination or infinite scroll.

MEAL DETAIL: Hero image, title, meta; tabs Ingredients / Instructions / Nutrition; actions: Add to plan, Favourite, Edit.

CREATE MEAL: Form: name, description, category, prep/cook time, servings, calories; ingredients (search+add); instructions; image; diet/allergen tags; AI generate option.

MY FRIDGE: Search to add; list (name, amount, unit, remove); empty: “Your fridge is empty”.

PLANS LIST: Past/current plans with week range, Go to plan link.

PLAN DETAIL (single day): Date, back link; meal slots; kcal summary + progress; Add extra.

ONBOARDING (5 steps): Biometrics → Dietary → Logistics → Appetite → Dish types. Form fields, Next/Back, progress indicator.

MODALS: Meal selector (search, list with thumbnail+meta, Load more). Generate with ingredients (search ingredients, add to list, Generate).

Map to shadcn: Button, Input, Checkbox, Card, Dialog, Sheet, Dropdown, Tabs, Progress, Badge, Sidebar, Collapsible, Command. Meal categories: Breakfast, Lunch, Dinner, Snack, Dessert, Drinks. Diet tags: Vegan, Vegetarian, Keto, Paleo, Mediterranean, Low carb. Icons: Lucide-style. Include empty states and loading skeletons. Accessibility: contrast, focus, touch ≥44px.
```
