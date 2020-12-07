export const isNum = val => {
  if (typeof val === 'string') {
    val = val.replace(/[,.]/g, '');
  }
  return /^\d+$/.test(val)
};

export function isUniqueFields(arr: any[]) {
  return [...new Set(arr)].length === arr.length;
}
