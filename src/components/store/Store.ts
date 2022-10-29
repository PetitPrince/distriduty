import dayjs, { Dayjs } from "dayjs";
import produce from "immer";
import slugify from "slugify";
import create from "zustand";
import { persist } from "zustand/middleware";
import {
  Duty,
  generateDefaultDuties,
  HOLIDAY_FRIBOURG,
  mergeOverlappingDuties,
} from "../duties/Duties";
import { sortDate } from "../practices/AddDateBadge";
import { Practices } from "../practices/Practice";

export interface Practice {
  id: string;
  name: string;
  employeePercentage: number;
  noDutyDates: Date[];
  isIgnoredInCount: boolean;
  nbShortDutiesToDo: number;
  nbNormalDutiesToDo: number;
}

const todayYear = new Date().getFullYear();

// let defaultDuties = generateDefaultDuties(todayYear, holidayFribourg).sort(
//   (a, b) => a.dateStart.getTime() - b.dateStart.getTime()
// );
// defaultDuties = mergeOverlappingDuties(defaultDuties);
let defaultDuties: Duty[] = [];
const makePractice = (
  name: string,
  employeePercentage: number,
  isIgnoredInCount?: boolean
) => {
  const newPractice: Practice = {
    id: slugify(name, { lower: true }),
    name: name,
    employeePercentage: employeePercentage,
    noDutyDates: [],
    isIgnoredInCount: isIgnoredInCount ? isIgnoredInCount : false,
    nbShortDutiesToDo: 0,
    nbNormalDutiesToDo: 0,
  };
  return newPractice;
};

const defaultPractices = [
  makePractice("Butty", 0, true),
  makePractice("Wicky", 70),
  makePractice("Otten", 90),
  makePractice("Hamman", 90),
  makePractice("3 sapins", 160),
  makePractice("Repond", 120),
];

interface DistrigardeStore {
  practices: Practice[];
  duties: Duty[];
  setPractices: (newPractices: Practice[]) => void;
  addPractice: (newPractice: Practice) => void;
  getPractice: (practiceId: string) => Practice;
  removePractice: (id: string) => void;
  modifyPracticeName: (id: string, newName: string) => void;
  modifyPracticeEmployeePercentage: (id: string, newPercentage: number) => void;
  modifyPracticeNbShortDutiesToDo: (
    id: string,
    newNbShortDutiesToDo: number
  ) => void;
  decrementPracticeNbShortDutiesToDo: (id: string) => void;
  incrementPracticeNbShortDutiesToDo: (id: string) => void;
  modifyPracticeNbNormalDutiesToDo: (
    id: string,
    newNbShortDutiesToDo: number
  ) => void;
  decrementPracticeNbNormalDutiesToDo: (id: string) => void;
  incrementPracticeNbNormalDutiesToDo: (id: string) => void;
  modifyDutyResponsible: (dutyId: string, responsible: Practice | null) => void;
  addNoDutyDateToPractice: (id: string, newDate: Date) => void;
  removeNoDutyDateToPractice: (id: string, dateToRemove: Date) => void;
  getAllPracticesUnavailableDates: () => Date[];
  modifyDutyDates: (dutyId: string, dates: Date[]) => void;
  setDuties: (newDuties: Duty[]) => void;
  resetAllDutiesResponsible: () => void;

  deleteDuty: (dutyId: string) => void;
  addDuty: (newDuty: Duty) => void;
  getAllDutyDates: () => [Date, Date][];
}

export const useDistrigardeStore = create<DistrigardeStore>()(
  persist(
    (set, get) => {
      return {
        practices: defaultPractices,
        duties: defaultDuties,
        addPractice: (newPractice: Practice) => {
          set(produce((draftState) => draftState.practices.push(newPractice)));
        },
        setPractices: (newPractices: Practice[]) => {
          set(
            produce((draftState) => {
              draftState.practices = newPractices;
            })
          );
        },
        removePractice: (practiceId: string) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );

              draftState.practices.splice(idIdx, 1);
            })
          );
        },
        modifyPracticeName: (id: string, newName: string) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex((x) => x.id === id);
              draftState.practices[idIdx].name = newName;
            })
          );
        },
        getPractice: (practiceId: string) => {
          const idIdx = get().practices.findIndex((x) => x.id === practiceId);
          return get().practices[idIdx];
        },
        modifyPracticeEmployeePercentage: (
          practiceId: string,
          newPercentage: number
        ) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              draftState.practices[idIdx].employeePercentage = newPercentage;
            })
          );
        },
        modifyPracticeNbShortDutiesToDo: (
          practiceId: string,
          newNbShortDutiesToDo: number
        ) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              draftState.practices[idIdx].nbShortDutiesToDo =
                newNbShortDutiesToDo;
            })
          );
        },
        decrementPracticeNbShortDutiesToDo: (practiceId: string) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              draftState.practices[idIdx].nbShortDutiesToDo--;
            })
          );
        },
        incrementPracticeNbShortDutiesToDo: (practiceId: string) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              draftState.practices[idIdx].nbShortDutiesToDo++;
            })
          );
        },
        modifyPracticeNbNormalDutiesToDo: (
          practiceId: string,
          newNbNormalDutiesToDo: number
        ) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              draftState.practices[idIdx].nbNormalDutiesToDo =
                newNbNormalDutiesToDo;
            })
          );
        },
        decrementPracticeNbNormalDutiesToDo: (practiceId: string) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              draftState.practices[idIdx].nbNormalDutiesToDo--;
            })
          );
        },
        incrementPracticeNbNormalDutiesToDo: (practiceId: string) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              draftState.practices[idIdx].nbNormalDutiesToDo++;
            })
          );
        },
        addNoDutyDateToPractice: (practiceId: string, newDate: Date) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              console.log(idIdx);
              draftState.practices[idIdx].noDutyDates.push(newDate);
            })
          );
        },
        removeNoDutyDateToPractice: (
          practiceId: string,
          dateToBeRemoved: Date
        ) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.practices.findIndex(
                (x) => x.id === practiceId
              );
              const dateIdx = draftState.practices[idIdx].noDutyDates.findIndex(
                (d) => dayjs(d).isSame(dayjs(dateToBeRemoved), "week")
              );
              draftState.practices[idIdx].noDutyDates.splice(dateIdx, 1);
            })
          );
        },
        getAllPracticesUnavailableDates: () => {
          let unavailabledates: Date[] = [];
          for (const practice of get().practices) {
            unavailabledates = unavailabledates.concat(
              unavailabledates,
              practice.noDutyDates
            );
          }
          return unavailabledates;
        },
        resetAllDutiesResponsible: () => {
          set(
            produce((draftState: DistrigardeStore) => {
              for (const duty of draftState.duties) {
                duty.responsible = null;
              }
            })
          );
        },

        modifyDutyDates: (dutyId: string, dates: Date[]) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.duties.findIndex((x) => x.id === dutyId);
              const sortedDates = dates.sort(sortDate);
              if (sortedDates.length === 2) {
                draftState.duties[idIdx].dateStart = sortedDates[0];
                draftState.duties[idIdx].dateEnd = sortedDates[1];
              } else if (sortedDates.length === 1) {
                draftState.duties[idIdx].dateStart = sortedDates[0];
                draftState.duties[idIdx].dateEnd = sortedDates[0];
              }
            })
          );
        },
        modifyDutyResponsible: (
          dutyId: string,
          responsible: Practice | null
        ) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.duties.findIndex((x) => x.id === dutyId);
              draftState.duties[idIdx].responsible = responsible;
            })
          );
        },
        setDuties: (newDuties: Duty[]) => {
          set(
            produce((draftState) => {
              draftState.duties = newDuties;
            })
          );
        },
        deleteDuty: (dutyId: string) => {
          set(
            produce((draftState: DistrigardeStore) => {
              const idIdx = draftState.duties.findIndex((x) => x.id === dutyId);

              draftState.duties.splice(idIdx, 1);
            })
          );
        },
        addDuty: (newDuty: Duty) => {
          set(
            produce((draftState: DistrigardeStore) => {
              draftState.duties.push(newDuty);
            })
          );
        },
        getAllDutyDates: () => {
          return get().duties.map((d) => [d.dateStart, d.dateEnd]);
        },
      };
    },
    {
      name: "distrigarde",
      version: 1,
    }
  )
);
