// The words of the transcript's numbers and grades, apart from the dialog so they can be tested.
import type { Grade } from '../../project/grades';

/** "Overall GPA 3.25", or "Overall GPA none yet" when no course is graded. */
export const gpaText = (gpa: number | undefined, label: string): string => `${label} ${gpa === undefined ? 'none yet' : gpa.toFixed(2)}`;

/** A grade for a screen reader: "Grade B-" or "not played". */
export const gradeLabel = (g: Grade | undefined): string => (g ? `Grade ${g}` : 'Not played');
