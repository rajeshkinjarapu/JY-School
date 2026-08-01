export const getClassOrderIndex = (name: string): number => {
  const lower = name.toLowerCase().trim();
  
  if (lower.includes('nursery') || lower.includes('nursary')) return 1;
  if (lower.includes('pp1') || lower.includes('lkg') || lower === 'pp-1') return 2;
  if (lower.includes('pp2') || lower.includes('ukg') || lower === 'pp-2') return 3;
  
  // match patterns like "1st", "2nd", "10th", "1", "2"
  const match = lower.match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    return 3 + num; // 1st -> 4, 10th -> 13
  }
  
  return 99; // unknown classes go to the end
};

export const sortClasses = <T extends { name: string; section?: string | null }>(classes: T[]): T[] => {
  return classes.sort((a, b) => {
    const orderA = getClassOrderIndex(a.name);
    const orderB = getClassOrderIndex(b.name);
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    const secA = (a.section || '').toLowerCase();
    const secB = (b.section || '').toLowerCase();
    if (secA < secB) return -1;
    if (secA > secB) return 1;
    return 0;
  });
};
