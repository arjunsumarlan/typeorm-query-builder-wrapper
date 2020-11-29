export const isNum = val => /^\d+$/.test(val);

export function isUniqueFields(arr: any[]) {
  const seenValues = {};

  for (const el of arr) {
    // we already saw this element in the array
    if (seenValues[el.toString()]) {
      return false;
    } else {
      seenValues[el.toString()] = true;
    }
  }

  return true;
}
