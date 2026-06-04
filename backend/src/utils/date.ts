export const getDayRange = (dateInput?: string) => {
  const base = dateInput ? new Date(dateInput) : new Date();

  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

