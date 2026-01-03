export const calculateProrationRatio = (
  totalWorkingDays: number,
  daysPresent: number
): number => {
  if (totalWorkingDays <= 0) {
    throw new Error("Invalid totalWorkingDays in attendance");
  }

  if (daysPresent < 0 || daysPresent > totalWorkingDays) {
    throw new Error("Invalid daysPresent in attendance");
  }

  return Number((daysPresent / totalWorkingDays).toFixed(4));
};
