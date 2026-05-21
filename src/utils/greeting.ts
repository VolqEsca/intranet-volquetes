export const getGreeting = (date: Date = new Date()): string => {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
};
