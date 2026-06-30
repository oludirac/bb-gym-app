export const bodyPartCategories = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "cardio",
  "mobility",
  "full_body"
] as const;

export const bodyPartCategorySet = new Set<string>(bodyPartCategories);

export function formatExerciseCategory(category: string) {
  return category.replaceAll("_", " ");
}
