import "./App.css";
import {
  Button,
  Container,
  Group,
  MantineProvider,
  ScrollArea,
  Stack,
  Stepper,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import "dayjs/locale/fr-ch";
import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr-ch";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
import { current } from "immer";
import { Practices } from "./components/practices/Practice";
import { mountStoreDevtool } from "simple-zustand-devtools";

import { Duties } from "./components/duties/Duties";
import { DistributeDuties } from "./components/distributesDuties/distributeDuties";
import { ScheduleDuties } from "./components/scheduleDuties/scheduleDuties";
import { useDistrigardeStore } from "./components/store/Store";
import { NotificationsProvider } from "@mantine/notifications";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  IconAB,
  IconBuildingHospital,
  IconCalculator,
  IconCalendarEvent,
  IconPhoneCalling,
} from "@tabler/icons";
import { Export } from "./components/export/export";

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("Store", useDistrigardeStore);
}
dayjs.locale("fr-ch");
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

function App() {
  const [active, setActive] = useState(1);
  const nextStep = () =>
    setActive((current) => (current < 4 ? current + 1 : current));
  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

  return (
    <MantineProvider theme={{ datesLocale: "fr-ch" }}>
      <DndProvider backend={HTML5Backend}>
        <NotificationsProvider>
          <Container>
            <Stack>
              <Stepper active={active} onStepClick={setActive} breakpoint="sm">
                <Stepper.Step
                  label="Cabinets"
                  description="Lister les cabinets dans le cercle de garde"
                >
                  <Practices />
                </Stepper.Step>
                <Stepper.Step
                  label="Gardes"
                  description="Lister toutes les gardes"
                >
                  <Duties />
                </Stepper.Step>
                <Stepper.Step
                  label="Répartion"
                  description="Répartir le nombre de gardes"
                >
                  <DistributeDuties />
                </Stepper.Step>
                <Stepper.Step
                  label="Planification"
                  description="Programmer les gardes"
                >
                  <ScheduleDuties />
                </Stepper.Step>
                <Stepper.Completed>
                  <Export />
                </Stepper.Completed>
              </Stepper>

              <Group position="center" mt="xl">
                <Button variant="default" onClick={prevStep}>
                  Précédent
                </Button>
                {active < 4 ? (
                  <Button onClick={nextStep}>Suivant</Button>
                ) : null}
              </Group>
            </Stack>
          </Container>
        </NotificationsProvider>
      </DndProvider>
    </MantineProvider>
  );
}

export default App;
