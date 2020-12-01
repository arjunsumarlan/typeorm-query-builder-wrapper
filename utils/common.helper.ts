export const isNum = val => /^\d+$/.test(val);

export function isUniqueFields(arr: any[]) {
  return [...new Set(arr)].length === arr.length;
}
