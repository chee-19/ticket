export const DEPARTMENTS = [
  'Finance',
  'Dev',
  'Product',
  'Security',
  'Support',
  'All Departments',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function shouldFilterByDepartment(
  department: Department | null | undefined
): department is Exclude<Department, 'All Departments'> {
  return Boolean(department && department !== 'All Departments');
}
