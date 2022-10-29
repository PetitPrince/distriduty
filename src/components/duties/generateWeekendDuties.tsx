import { Duty, findWeekendsInYear, DutyConstructor } from "./Duties";

export function generateWeekendDuties(year: number) {
  let duties: Duty[] = [];
  // Add weekend
  const weekends = findWeekendsInYear(year);
  for (let idx = 0; idx < weekends.length; idx++) {
    const weekend = weekends[idx];
    duties.push(
      DutyConstructor(weekend[0], weekend[1], "Weekend " + (1 + idx).toString())
    );
  }
  return duties;
}
