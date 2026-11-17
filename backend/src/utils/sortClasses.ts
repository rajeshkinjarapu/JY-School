export const getClassOrderIndex = (name: string): number => {
  if (!name) return 99;
  const lower = name.toLowerCase().trim();
  
  // Nursery / Nur / Playgroup / Pre-KG
  if (
    lower.includes('nursery') ||
    lower.includes('nursary') ||
    lower.includes('nur') ||
    lower.includes('pre-kg') ||
    lower.includes('playgroup')
  ) {
    return 1;
  }
  
  // LKG / PP1 / PP-1 / Pre-Primary 1
  if (
    lower.includes('pp1') ||
    lower.includes('pp-1') ||
    lower.includes('lkg') ||
    lower.includes('l.k.g') ||
    lower.includes('lower kg') ||
    lower.includes('pre-primary 1')
  ) {
    return 2;
  }
  
  // UKG / PP2 / PP-2 / Pre-Primary 2
  if (
    lower.includes('pp2') ||
    lower.includes('pp-2') ||
    lower.includes('ukg') ||
    lower.includes('u.k.g') ||
    lower.includes('upper kg') ||
    lower.includes('pre-primary 2')
  ) {
    return 3;
  }
  
  // match patterns like "1st", "2nd", "10th", "Class 1", "Class 10", "1", "10"
  const match = lower.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return 3 + num; // 1st -> 4, 10th -> 13
  }
  
  return 99; // unknown classes go to the end
};

export const sortClasses = <T extends { name?: string; section?: string | null } | string>(classes: T[]): T[] => {
  if (!Array.isArray(classes)) return [];
  
  return [...classes].sort((a, b) => {
    const nameA = typeof a === 'string' ? a : (a?.name || '');
    const nameB = typeof b === 'string' ? b : (b?.name || '');
    
    let secA = typeof a === 'string' ? '' : (a?.section || '');
    let secB = typeof b === 'string' ? '' : (b?.section || '');

    if (!secA && nameA.includes('-')) {
      secA = nameA.split('-')[1]?.trim() || '';
    }
    if (!secB && nameB.includes('-')) {
      secB = nameB.split('-')[1]?.trim() || '';
    }
    
    const orderA = getClassOrderIndex(nameA);
    const orderB = getClassOrderIndex(nameB);
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return secA.localeCompare(secB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const sortStudentsClassWiseAndAlphabetical = <T extends any>(students: T[]): T[] => {
  if (!Array.isArray(students)) return [];
  return [...students].sort((a: any, b: any) => {
    const classA = a.class || {};
    const classB = b.class || {};
    const classNameA = classA.name || a.className || '';
    const classNameB = classB.name || b.className || '';

    const rankA = getClassOrderIndex(classNameA);
    const rankB = getClassOrderIndex(classNameB);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const secA = classA.section || (classNameA.includes('-') ? classNameA.split('-')[1]?.trim() : '') || '';
    const secB = classB.section || (classNameB.includes('-') ? classNameB.split('-')[1]?.trim() : '') || '';
    const secComp = secA.localeCompare(secB, undefined, { numeric: true, sensitivity: 'base' });
    if (secComp !== 0) {
      return secComp;
    }

    const nameA = (a.user?.name || a.name || a.studentName || '').trim();
    const nameB = (b.user?.name || b.name || b.studentName || '').trim();
    const nameComp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    if (nameComp !== 0) {
      return nameComp;
    }

    const rollA = (a.rollNo || '').trim();
    const rollB = (b.rollNo || '').trim();
    return rollA.localeCompare(rollB, undefined, { numeric: true });
  });
};


