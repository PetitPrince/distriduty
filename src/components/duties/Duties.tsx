import {
  ActionIcon,
  Blockquote,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Radio,
  ScrollArea,
  Stack,
  Table,
  TextInput,
  Title,
  Text,
  Center,
} from "@mantine/core";
import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Practice, useDistrigardeStore } from "../store/Store";
import { generateHolidayDuties } from "./generateHolidayDuties";
import { generateWeekendDuties } from "./generateWeekendDuties";
import { IconEdit, IconInfoCircle, IconTrash } from "@tabler/icons";
import {
  AddDatePopOver,
  generateDateExcluderNoPracticeUnavailableAndOnlyWeekends,
} from "../practices/AddDateBadge";
import { v4 as uuid } from "uuid";
import { DatePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
export interface Duty {
  id: string;
  dateStart: Date;
  dateEnd: Date;
  responsible?: Practice | null;
  note?: string;
}
export interface HolidayStatus {
  [key: string]: boolean;
}

export const HOLIDAY_FRIBOURG: HolidayStatus = {
  nouvelAn: true,
  saintBerchtold: false,
  epiphanie: false,
  republiqueNeuchatel: false,
  saintJoseph: false,
  farthsfest: false,
  vendrediSaint: true,
  lundiDePaques: true,
  ascenscion: true,
  feteDuTravail: false,
  pentecote: true,
  feteDieu: true,
  plebisciteJura: false,
  saintPierreEtPaul: false,
  feteNationale: true,
  assomption: true,
  jeuneGeneve: false,
  jeunefederal: false,
  saintNicolasDeFlue: false,
  toussaint: true,
  immaculeeConception: true,
  noel: true,
  saintEtienne: true,
  restaurationRepubliquegeneve: false,
};

// let range = (n: number) => [...Array(n).keys()];
// const defaultDuties: Duty[] = range(52).map((n) => {
//   return {
//     weekNb: n,
//   };
// });

export const findWeekendsInYear = (year: number) => {
  const firstDayOfYear = dayjs(String(year), "YYYY");
  const firstWeekEnd = firstDayOfYear.startOf("week").add(5, "day");

  let weekends: [Date, Date][] = [];
  let weekOffset: number = 0;
  while (
    firstWeekEnd.add(weekOffset * 7, "days").isBefore(String(year + 1), "year")
  ) {
    const aSaturday = firstWeekEnd.add(weekOffset * 7, "days");
    const aSunday = aSaturday.add(1, "day");
    weekends.push([aSaturday.toDate(), aSunday.toDate()]);
    weekOffset = weekOffset + 1;
  }
  return weekends;
};
const todayYear = new Date().getFullYear();

export const DutyConstructor = (
  dateStart: Date,
  dateEnd: Date,
  note?: string
) => {
  const newDuty: Duty = {
    id: uuid(),
    dateStart: dateStart,
    dateEnd: dateEnd,
    note: note,
  };
  return newDuty;
};

export const generateDefaultDuties = (
  year: number,
  activeHolidays: HolidayStatus
) => {
  let defaultDuties: Duty[] = [];
  const weekendDuties: Duty[] = generateWeekendDuties(year);

  const holidayDuties: Duty[] = generateHolidayDuties(activeHolidays, year);

  return defaultDuties.concat(weekendDuties, holidayDuties);
};

const DutyRow = (props: { duty: Duty }) => {
  const { duty } = props;

  const dutyStart = dayjs(duty.dateStart);
  const dutyEnd = dayjs(duty.dateEnd);
  let displayThis = dutyStart.format("LL") + "–" + dutyEnd.format("LL");
  if (dutyStart.isSame(dutyEnd, "day")) {
    displayThis = dutyStart.format("LL");
  }

  return (
    <tr>
      <td>{displayThis}</td>
      <td>{duty.note}</td>
      <td>
        <Group>
          {/* <ModifyDateButton duty={duty} /> */}
          <DeleteDateButton duty={duty} />
        </Group>
      </td>
    </tr>
  );
};

const DeleteDateButton = (props: { duty: Duty }) => {
  const deleteDuty = useDistrigardeStore((state) => state.deleteDuty);

  const supprimer = (dutyId: string) => {
    deleteDuty(dutyId);
  };
  return (
    <Button
      radius="xl"
      size="xs"
      compact
      variant="filled"
      onClick={() => supprimer(props.duty.id)}
    >
      <IconEdit size={16} /> Supprimer
    </Button>
  );
};

export const ModifyDateButton = (props: { duty: Duty }) => {
  const { duty } = props;
  const [popUpOpened, setPopUpOpened] = useState(false);
  const getAllUnavailableDates = useDistrigardeStore(
    (state) => state.getAllPracticesUnavailableDates
  );
  const unavailableDates = getAllUnavailableDates().map((d) => dayjs(d));
  const dateExcluderFunction =
    generateDateExcluderNoPracticeUnavailableAndOnlyWeekends(unavailableDates);

  const modifyDutyDates = useDistrigardeStore((state) => state.modifyDutyDates);

  const processDates = (dates: Date[]) => {
    modifyDutyDates(duty.id, dates);
  };

  return (
    <AddDatePopOver
      popUpOpened={popUpOpened}
      multiple={true}
      datesCounterLimit={2}
      setPopUpOpened={setPopUpOpened}
      excludeDate={dateExcluderFunction}
      processDates={processDates}
    >
      <Button
        radius="xl"
        size="xs"
        compact
        variant="filled"
        onClick={() => setPopUpOpened((o) => !o)}
      >
        <IconEdit size={16} /> Editer
      </Button>
    </AddDatePopOver>
  );
};

const sortDutiesByStartDate = (a: Duty, b: Duty): number => {
  const newLocal = dayjs(a.dateStart).unix() - dayjs(b.dateStart).unix();
  return newLocal;
};

export const Duties = (props: {}) => {
  let duties: Duty[] = useDistrigardeStore((state) => state.duties);
  const setDuties = useDistrigardeStore((state) => state.setDuties);

  const dutyRowsSorted = duties.slice().sort(sortDutiesByStartDate);
  const dutyRows = dutyRowsSorted.length ? (
    dutyRowsSorted
      // .sort(sortDutiesByStartDate)
      .map((d: Duty) => <DutyRow duty={d} key={"dr" + d.id} />)
  ) : (
    <tr>
      <td colSpan={3}>
        <Center>
          Pas de garde pour le moment. Veuillez en rajouter via les formulaires
          plus bas.
        </Center>
      </td>
    </tr>
  );

  const onClickManager = () => {
    setDuties([]);
  };

  const dutiesLength = duties.map(
    (d) => dayjs(d.dateEnd).diff(dayjs(d.dateStart), "days") + 1
  );

  const numberOfOnes = dutiesLength.filter((d) => d === 1).length;
  const numberOfTwos = dutiesLength.filter((d) => d === 2).length;

  const numberOfNormalDuties = numberOfTwos;
  const numberOfShortDuties = numberOfOnes;

  return (
    <>
      <Title>Liste des gardes</Title>
      <Blockquote icon={<IconInfoCircle size={24} />}>
        <Title order={5}>Instructions</Title>
        <Text>
          Lister toutes les gardes à faire au cours d'une année. Vous pouvez
          automatiquement ajouter les gardes, ou en ajouter/enlever une par une.
        </Text>
      </Blockquote>
      <Center>
        <Group>
          <Text>
            Nombre de petite garde: <b>{numberOfShortDuties}</b>
          </Text>
          <Text>
            Nombre de garde de weekend: <b>{numberOfNormalDuties}</b>
          </Text>
        </Group>
      </Center>

      <ScrollArea.Autosize maxHeight={500}>
        <Table>
          <thead>
            <tr>
              <th>Dates</th>
              <th>Note</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>{dutyRows}</tbody>
        </Table>
      </ScrollArea.Autosize>

      <Group sx={{ alignItems: "flex-start" }}>
        <AutoAddDuty />
        <NewDuty />
        <Stack>
          <Title order={5}>Autres actions</Title>
          <Button radius="xl" onClick={onClickManager}>
            Effacer toutes les gardes
          </Button>
        </Stack>
      </Group>
    </>
  );
};

export const AutoAddDuty = (props: {}) => {
  const setDuties = useDistrigardeStore((state) => state.setDuties);

  const form = useForm({
    initialValues: {
      year: todayYear,
      isAddingWeekends: true,
      isAddingHolidays: true,
    },
  });

  const commitAutoAdd = (
    values = {
      year: todayYear,
      isAddingWeekends: true,
      isAddingHolidays: true,
    }
  ) => {
    let newDuties: Duty[] = [];
    if (values.isAddingHolidays) {
      const holidayDuties: Duty[] = generateHolidayDuties(
        HOLIDAY_FRIBOURG,
        values.year
      );
      newDuties = newDuties.concat(holidayDuties);
    }

    if (values.isAddingWeekends) {
      const weekendDuties: Duty[] = generateWeekendDuties(values.year);
      newDuties = newDuties.concat(weekendDuties);
    }

    newDuties.sort(sortDutiesByStartDate);
    newDuties = mergeOverlappingDuties(newDuties);
    setDuties(newDuties);
  };

  return (
    <Stack>
      <Title order={5}>Générer des gardes automatiquement</Title>
      <form onSubmit={form.onSubmit(commitAutoAdd)}>
        <Stack>
          <NumberInput
            placeholder="Année"
            label="Année"
            {...form.getInputProps("year")}
          />
          <Stack>
            <Text>Type</Text>
            <Group>
              <Checkbox
                label="Weekends"
                {...form.getInputProps("isAddingHolidays", {
                  type: "checkbox",
                })}
              />

              <Checkbox
                label="Jours feriés"
                {...form.getInputProps("isAddingHolidays", {
                  type: "checkbox",
                })}
              />
            </Group>
          </Stack>
        </Stack>
        <Group position="right" mt="md">
          <Button
            radius="xl"
            variant="filled"
            type="submit"
            // onClick={() => supprimer(props.duty.id)}
          >
            Générer
          </Button>
        </Group>
      </form>
    </Stack>
  );
};

export const NewDuty = (props: {}) => {
  const getAllUnavailableDates = useDistrigardeStore(
    (state) => state.getAllPracticesUnavailableDates
  );
  const getAllDutyDates = useDistrigardeStore((state) => state.getAllDutyDates);

  const unavailableDates = getAllUnavailableDates().map((d) => dayjs(d));
  const existingDutyDates = getAllDutyDates();

  const addDuty = useDistrigardeStore((state) => state.addDuty);
  const form = useForm({
    initialValues: {
      startDate: new Date(),
      dutyType: "normalDuty",
      note: "",
    },

    validate: {
      startDate: (value, values) => {
        console.log(value);
        const theDayAfter = dayjs(value).add(1, "day");
        console.log(theDayAfter.toISOString());
        if (values.dutyType === "normalDuty") {
          const isOverLappingWithProblematicDates = dateExcluderFunction(
            theDayAfter.toDate()
          );
          return isOverLappingWithProblematicDates
            ? "Chevauchement avec une autre garde"
            : null;
        }
        return null;
      },
    },
  });

  const dateExcluderFunction = (date: Date) => {
    const currentDate = dayjs(date);
    const notUnavailable = unavailableDates.some((unavailableDate) =>
      unavailableDate.isSame(currentDate, "day")
    );
    const notInExisting = existingDutyDates.some((existingDutyDates) =>
      currentDate.isBetween(
        dayjs(existingDutyDates[0]),
        dayjs(existingDutyDates[1]),
        "day",
        "[]"
      )
    );
    return notInExisting || notUnavailable;
  };

  const commitNewDuty = (values: {
    startDate: Date;
    dutyType: string;
    note: string;
  }) => {
    let endDate = values.startDate;

    if (values.dutyType === "normalDuty") {
      endDate = dayjs(values.startDate).add(1, "day").toDate();
    }
    addDuty(DutyConstructor(values.startDate, endDate, values.note));
  };
  return (
    <Stack>
      <Title order={5}>Ajouter une garde manuellement</Title>
      <form onSubmit={form.onSubmit(commitNewDuty)}>
        <Stack>
          <DatePicker
            placeholder="Choisir une date de garde"
            label="Date de garde"
            excludeDate={dateExcluderFunction}
            {...form.getInputProps("startDate")}
          />

          <Radio.Group
            name="dutyType"
            label="Choisir un type de garde"
            {...form.getInputProps("dutyType")}
          >
            <Radio value="shortDuty" label="Garde courte" />
            <Radio value="normalDuty" label="Garde de weekend" />
          </Radio.Group>
          <TextInput label="Note" />
        </Stack>
        <Group position="right" mt="md">
          <Button
            radius="xl"
            variant="filled"
            type="submit"
            // onClick={() => supprimer(props.duty.id)}
          >
            Ajouter
          </Button>
        </Group>
      </form>
    </Stack>
  );
};

export const mergeOverlappingDuties = (someDuties: Duty[]) => {
  // json stringify will kill my dates objects...
  // const dutiesJson = JSON.stringify(someDuties);
  // const sd: Duty[] = JSON.parse(dutiesJson);
  const sd: Duty[] = Array.from(someDuties);
  for (let idx = 0; idx < sd.length; idx++) {
    const anchorDuty = sd[idx];
    if (anchorDuty && idx + 1 < sd.length) {
      const mergeCandidateDuty = sd[idx + 1];
      const anchorDutyEndDate = dayjs(anchorDuty.dateEnd);
      if (
        // dayjs(mergeCandidateDuty.dateStart).isSameOrBefore(

        dayjs(mergeCandidateDuty.dateStart).isSame(anchorDutyEndDate, "day")
      ) {
        anchorDuty.dateEnd = mergeCandidateDuty.dateEnd;
        if (mergeCandidateDuty.note) {
          anchorDuty.note = anchorDuty.note + " + " + mergeCandidateDuty.note;
        }
        sd.splice(idx + 1, 1);
        idx = idx - 1;
      }
    }
  }
  return sd;
};

// const mergeAdjacentDuties = (someDuties: Duty[]) => {
//   const dutiesJson = JSON.stringify(someDuties);
//   const sd: Duty[] = JSON.parse(dutiesJson);
//   for (let idx = 0; idx < sd.length; idx++) {
//     const anchorDuty = sd[idx];
//     if (anchorDuty && idx + 1 < sd.length) {
//       const mergeCandidateDuty = sd[idx + 1];
//       const theDayAfterAnchor = dayjs(anchorDuty.dateEnd).add(1, "day");
//       if (
//         dayjs(mergeCandidateDuty.dateStart).isSameOrBefore(
//           theDayAfterAnchor,
//           "day"
//         )
//       ) {
//         anchorDuty.dateEnd = mergeCandidateDuty.dateEnd;
//         if (mergeCandidateDuty.note) {
//           anchorDuty.note = anchorDuty.note + " + " + mergeCandidateDuty.note;
//         }
//         mergeCandidateDuty.note = "XXXX";
//         sd.splice(idx + 1, 1);
//         idx = idx - 1;
//       }
//     }
//   }
//   return sd;
// };
