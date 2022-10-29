import {
  ActionIcon,
  Badge,
  Paper,
  Title,
  Table,
  Text,
  Blockquote,
} from "@mantine/core";
import dayjs from "dayjs";
import { IconInfoCircle, IconX } from "@tabler/icons";
import { Practice, useDistrigardeStore } from "../store/Store";
import { AddDateBadge } from "./AddDateBadge";

const RemoveDateButton = (props: { date: Date; practiceId: string }) => {
  const { date, practiceId } = props;
  const removeNoDutyDateToPractice = useDistrigardeStore(
    (state) => state.removeNoDutyDateToPractice
  );

  const handleRemoveDateToPractice = () => {
    removeNoDutyDateToPractice(practiceId, date);
  };

  return (
    <ActionIcon
      size="xs"
      color="blue"
      radius="xl"
      variant="transparent"
      onClick={handleRemoveDateToPractice}
    >
      <IconX size={10} />
    </ActionIcon>
  );
};

const DateBadge = (props: { date: Date; practiceId: string }) => {
  const { date, practiceId } = props;
  const removeButton = <RemoveDateButton date={date} practiceId={practiceId} />;

  return (
    <Badge
      variant="outline"
      sx={{ paddingRight: 3 }}
      rightSection={removeButton}
    >
      <Text>{dayjs(date).format("LL")}</Text>
    </Badge>
  );
};

const UnavailableDates = (props: { dates: Date[]; practiceId: string }) => {
  const { dates, practiceId } = props;
  const renderedDates = dates.map((d) => {
    return (
      <DateBadge
        key={practiceId + dayjs(d).toDate().getTime().toString()}
        date={d}
        practiceId={props.practiceId}
      />
    );
  });
  return <>{renderedDates}</>;
};

const PracticeRow = (props: { practice: Practice }) => {
  const removePractice = useDistrigardeStore((state) => state.removePractice);

  const { practice } = props;
  return (
    <tr>
      <td>{practice.name}</td>
      <td>{practice.employeePercentage}</td>
      <td width={300}>
        <UnavailableDates
          dates={practice.noDutyDates}
          practiceId={practice.id}
        />
        <AddDateBadge practiceId={practice.id} />
      </td>
      {/* <td>
        <Button onClick={() => removePractice(practice.id)}>
          Supprimer cabinet
        </Button>
      </td> */}
    </tr>
  );
};
export const Practices = (props: {}) => {
  const practices = useDistrigardeStore((state) => state.practices);

  const practiceRows = practices.map((p: Practice) => (
    <PracticeRow practice={p} key={p.id} />
  ));
  return (
    <>
      <Title>Liste des cabinets</Title>
      <Blockquote icon={<IconInfoCircle size={24} />}>
        <Title order={5}>Instructions</Title>
        <Text>
          Ajouter/enlever des dates où les gardes ne sont pas souhaitée.
        </Text>
      </Blockquote>

      <Table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Pourcentage employés</th>
            <th>Pas de garde à ces dates là</th>
            {/* <th>Actions</th> */}
          </tr>
        </thead>
        <tbody>{practiceRows}</tbody>
      </Table>
    </>
  );
};
