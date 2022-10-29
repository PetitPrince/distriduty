import {
  Blockquote,
  Stack,
  Table,
  Title,
  Text,
  Button,
  Group,
  Select,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons";
import dayjs from "dayjs";
import saveAs from "file-saver";
import { EventAttributes, DateArray, createEvents } from "ics";
import { useState } from "react";
import { utils, writeFile } from "xlsx";
import { Duty } from "../duties/Duties";
import { useDistrigardeStore } from "../store/Store";

export const Export = (props: {}) => {
  const duties = useDistrigardeStore((state) => state.duties);
  const practices = useDistrigardeStore((state) => state.practices);
  const [practiceId, setPracticeId] = useState("all");

  const practiceDisplayData = practices

    .map((p) => {
      return { value: p.id, label: p.name };
    })
    .concat({ value: "all", label: "Tous" });

  const currentDuties =
    practiceId === "all"
      ? duties
      : duties.filter((x) => x.responsible?.id === practiceId);
  const rows = currentDuties.map((d) => <DutyRow duty={d} />);

  return (
    <Stack>
      <Title order={2}>Fini !</Title>
      <Blockquote icon={<IconInfoCircle size={24} />}>
        <Title order={5}>Instructions</Title>
        <Text>
          Vous pouvez exporter les garde en tant que excel ou en fichier à
          importer dans votre logiciel de calendrier.
        </Text>
        <Text>Vous pouvez filtrer les gardes par cabinets.</Text>
      </Blockquote>
      <Group>
        <Select
          label="Cabinet"
          placeholder="Veuillez choisir un cabinet"
          data={practiceDisplayData}
          value={practiceId}
          onChange={(valStr: string) => setPracticeId(valStr)}
        />
        <Button onClick={() => exportToXlsx(currentDuties)}>
          Export (Excel)
        </Button>
        <Button onClick={() => exportToIcs(currentDuties)}>
          Export (calendrier)
        </Button>
      </Group>
      <Table sx={{ width: 600 }}>
        <thead style={{ fontWeight: "bold" }}>
          <tr>
            <td>Date</td>
            <td>Notes</td>
            <td>Assigné à</td>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </Stack>
  );
};

const exportToXlsx = (duties: Duty[]) => {
  const wb = utils.book_new();
  const xlsxRows = duties.map((d) => {
    return {
      Début: dayjs(d.dateStart).format("LL"),
      Fin: dayjs(d.dateEnd).format("LL"),
      Cabinet: d.responsible?.id,
      Note: d.note,
    };
  });

  const ws = utils.json_to_sheet(xlsxRows);
  const max_width = xlsxRows.reduce(
    (w, r) => Math.max(w, r.Début.toString().length),
    10
  );
  ws["!cols"] = [{ wch: max_width }];
  utils.book_append_sheet(wb, ws, "Dates de gardes");
  writeFile(wb, "gardes.xlsx");
};

const exportToIcs = (duties: Duty[]) => {
  const eventsFromDuties: EventAttributes[] = duties.map((d) => {
    const start1 = dayjs(d.dateStart)
      .format("YYYY-M-D")
      .split("-")
      .map((x) => parseInt(x));
    const start2: DateArray = [start1[0], start1[1], start1[2]];
    const end1 = dayjs(d.dateEnd)
      .format("YYYY-M-D")
      .split("-")
      .map((x) => parseInt(x));
    const end2: DateArray = [end1[0], end1[1], end1[2]];
    return {
      title: "Garde - " + d?.note,
      start: start2,
      end: end2,
      // Cabinet: d.responsible?.id,
      // Note: d.note,
    };
  });
  const { error, value } = createEvents(eventsFromDuties);
  console.log(value);
  if (value) {
    var blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
    saveAs(blob, "event.ics");
  }
  // if (value) {
  //   writeFileSync("${__dirname}/event.ics`", value);
  // }
};

const DutyRow = (props: { duty: Duty }) => {
  const { duty } = props;

  return (
    <tr key={duty.id}>
      <td>
        {dayjs(duty.dateStart).format("L")} – {dayjs(duty.dateEnd).format("L")}
      </td>
      <td>{duty.note}</td>
      <td>{duty.responsible?.name}</td>
    </tr>
  );
};
