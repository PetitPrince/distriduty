import {
  Button,
  Popover,
  Group,
  Stack,
  ScrollArea,
  Text,
  Box,
} from "@mantine/core";
import { useState } from "react";
import { Calendar } from "@mantine/dates";
import dayjs from "dayjs";
import { useDistrigardeStore } from "../store/Store";
import { showNotification } from "@mantine/notifications";

import { IconCalendarPlus } from "@tabler/icons";
export const generateDateExcluderNoPracticeUnavailableAndOnlyWeekends = (
  unavailableDates: dayjs.Dayjs[]
) => {
  const returnFunc = (date: Date): boolean => {
    const onlyWeekend = [1, 2, 3, 4, 5].includes(date.getDay());
    const notUnavailable = unavailableDates.some((unavailableDate) =>
      unavailableDate.isSame(date, "day")
    );
    return onlyWeekend || notUnavailable;
  };
  return returnFunc;
};
export const AddDateBadge = (props: { practiceId: string }) => {
  const [popUpOpened, setPopUpOpened] = useState(false);

  const getAllUnavailableDates = useDistrigardeStore(
    (state) => state.getAllPracticesUnavailableDates
  );
  const unavailableDates = getAllUnavailableDates().map((d) => dayjs(d));
  // const dateExcluderFunction =
  //   generateDateExcluderNoPracticeUnavailableAndOnlyWeekends(unavailableDates);
  const dateExcluderFunction = () => false;
  const addNoDutyDateToPractice = useDistrigardeStore(
    (state) => state.addNoDutyDateToPractice
  );
  const processDates = (dates: Date[]) => {
    dates.forEach((d) => addNoDutyDateToPractice(props.practiceId, d));
  };
  return (
    <AddDatePopOver
      popUpOpened={popUpOpened}
      multiple={true}
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
        <IconCalendarPlus size={16} /> Ajouter
      </Button>
    </AddDatePopOver>
  );
};

export const AddDatePopOver = (props: {
  popUpOpened: boolean;
  multiple: boolean;
  datesCounterLimit?: number;
  setPopUpOpened: (x: boolean) => void;
  excludeDate: (date: Date) => boolean;
  processDates: (dates: Date[]) => void;
  children: JSX.Element;
}) => {
  const {
    popUpOpened,
    multiple,
    datesCounterLimit,
    setPopUpOpened,
    excludeDate,
    processDates,
  } = props;
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const ddatesCounterLimit = datesCounterLimit ? datesCounterLimit : -1;

  const setSetSelcetedDates = (dates: Date[]) => {
    if (ddatesCounterLimit === -1 || dates.length <= ddatesCounterLimit) {
      setSelectedDates(dates);
    } else {
      showNotification({
        message: "Veuillez choisir au plus " + datesCounterLimit + " dates",
        color: "red",
      });
    }
  };

  const ajouterOnClick = (sd: Date[]) => {
    processDates(sd);
    setPopUpOpened(false);
    setSelectedDates([]);
  };

  return (
    <Popover
      opened={popUpOpened}
      onChange={setPopUpOpened}
      position="bottom-start"
      withArrow
      withinPortal
      shadow="md"
    >
      <Popover.Target>{props.children}</Popover.Target>

      <Popover.Dropdown>
        <Stack>
          <Group sx={{ alignItems: "flex-start" }}>
            <Calendar
              value={selectedDates}
              multiple={multiple}
              onChange={(x: Date[]) => setSetSelcetedDates(x)}
              excludeDate={excludeDate}
            />
            <Stack>
              <ScrollArea.Autosize maxHeight={250}>
                <MutipleDates dates={selectedDates} />
              </ScrollArea.Autosize>
            </Stack>
          </Group>
          <Group>
            <Button onClick={() => ajouterOnClick(selectedDates)}>
              Ajouter
            </Button>
            <Button onClick={() => setPopUpOpened(false)}>Annuler</Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export const sortDate = (d1: Date, d2: Date) => {
  return d1.getTime() - d2.getTime();
};
export const MutipleDates = (props: { dates: Date[] }) => {
  const fdates = props.dates.sort(sortDate).map((d) => {
    const dd = dayjs(d);
    return <Text key={dd.toDate().getTime()}>{dd.format("LL")}</Text>;
  });

  return <>{fdates}</>;
};
