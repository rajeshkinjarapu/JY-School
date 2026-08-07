export const formatExamOptionLabel = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/Model Examination/gi, 'Model Exam')
    .replace(/Examination/gi, 'Exam')
    .replace(/Grand Test/gi, 'GT')
    .replace(/\s+-\s+/g, ' - ');
};
