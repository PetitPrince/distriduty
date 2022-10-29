import {
  Box,
  Button,
  Group,
  Overlay,
  Radio,
  ScrollArea,
  SegmentedControl,
  Blockquote,
  Text,
  Select,
  Stack,
  Table,
  Title,
  Container,
} from "@mantine/core";
import { IconDots, IconGridDots, IconInfoCircle } from "@tabler/icons";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import {
  DragLayerMonitor,
  DragPreviewImage,
  useDrag,
  useDragLayer,
  useDrop,
} from "react-dnd";
import { DoDistrbuteDuties } from "../distributesDuties/distributeDuties";
import { Duty } from "../duties/Duties";
import { Practice, useDistrigardeStore } from "../store/Store";
import { utils, writeFile } from "xlsx";
import { getEmptyImage } from "react-dnd-html5-backend";
import { createEvents, DateArray, EventAttributes } from "ics";
import { saveAs } from "file-saver";

const computeDutyType = (d: Duty) => {
  const dutyLength = dayjs(d.dateEnd).diff(dayjs(d.dateStart), "days");
  if (dutyLength === 0) {
    return "shortDuty";
  } else if (dutyLength === 1) {
    return "normalDuty";
  } else {
    return "unknown";
  }
};

const checkDateInRange = (begin: Date, end: Date, dateToCheck: Date) => {
  const dbegin = dayjs(begin);
  const dend = dayjs(end);
  const ddateToCheck = dayjs(dateToCheck);
  // console.log(
  //   "Is " +
  //     ddateToCheck.format("LL") +
  //     " between " +
  //     dbegin.format("LL") +
  //     " and " +
  //     dend.format("LL") +
  //     "-->" +
  //     ddateToCheck.isBetween(dbegin, dend, "day", "[]")
  // );
  return ddateToCheck.isBetween(dbegin, dend, "day", "[]");
};

const autoScheduleThisPractice = (
  practice: Practice,
  duties: Duty[],
  dutyType: string
) => {
  let workingDuties: Duty[] = JSON.parse(JSON.stringify(duties));

  // Make a list containing only the relevent duties (exclude those unwanted by the practice, and those of the wrong category)
  let nbPlaceToFillMax = 0;
  if (dutyType === "shortDuty") {
    nbPlaceToFillMax = practice.nbShortDutiesToDo;
  } else if (dutyType === "normalDuty") {
    nbPlaceToFillMax = practice.nbNormalDutiesToDo;
  }

  const datesToBeFilteredOut = practice.noDutyDates;
  let availableDuties = workingDuties
    .filter((d) => computeDutyType(d) === dutyType)
    .filter((d) => {
      return datesToBeFilteredOut.every(
        (df) => !checkDateInRange(d.dateStart, d.dateEnd, df)
      );
    })
    .filter((d) => d.responsible == null);

  // processRecursive(availableDuties, dutyRearranged);
  const rootNode = makeATree(availableDuties);

  let collectionList = traverseTree(rootNode);
  let nbPlaceToFill = 0;
  if (collectionList) {
    nbPlaceToFill =
      collectionList.length - nbPlaceToFillMax >= 0
        ? nbPlaceToFillMax
        : collectionList.length;
    for (let idx = 0; idx < nbPlaceToFill; idx++) {
      collectionList[idx] = { ...collectionList[idx], responsible: practice };
    }
    for (const oneDuty of collectionList) {
      const idx = workingDuties.findIndex((x) => x.id === oneDuty.id);
      workingDuties[idx] = oneDuty;
    }
  }
  return { newDuties: workingDuties, numberOfDutiesChanged: nbPlaceToFill };
};
const traverseTree = (rootNode: Node) => {
  let collectionList: Duty[] = [];
  if (rootNode.value == null) {
    return;
  }
  const queue: Node[] = [];
  queue.push(rootNode);
  while (queue.length > 0) {
    if (queue[0].value && !collectionList.includes(queue[0].value)) {
      collectionList.push(queue[0].value);
    }
    const oneNode = queue.splice(0, 1)[0];
    if (oneNode.left) {
      queue.push(oneNode.left);
    }
    if (oneNode.right) {
      queue.push(oneNode.right);
    }
  }
  return collectionList;
};

const makeATree = (duties: Duty[]) => {
  const sequenceLength = duties.length;
  if (sequenceLength === 1) {
    return new Node({ value: duties[0] });
  } else if (sequenceLength === 0) {
    return new Node({});
  } else {
    const pivot = Math.floor(sequenceLength / 2);
    const leftList = duties.slice(0, pivot);
    const rightList = duties.slice(pivot);
    const newNode = new Node({ value: duties[pivot] });
    newNode.left = makeATree(leftList);
    newNode.right = makeATree(rightList);
    return newNode;
  }
};
class Node {
  value?: Duty;
  left?: Node;
  right?: Node;

  constructor(newNode: { value?: Duty; left?: Node; right?: Node }) {
    this.value = newNode.value;
    this.left = newNode.left;
    this.right = newNode.right;
  }
}

const getMiddleIdx = (dutiesArray: Duty[]) => {
  return Math.floor(dutiesArray.length / 2);
};

const processRecursive = (dutiesArray: Duty[], dutyRearranged: Duty[]) => {
  console.log("recursive");
  const middleIdx = getMiddleIdx(dutiesArray);
  // console.log("middleIdx: " + middleIdx);
  if (!dutyRearranged.includes(dutiesArray[middleIdx])) {
    dutyRearranged.push(dutiesArray[middleIdx]);
    console.log("push: " + dutiesArray[middleIdx].note);
  }
  const left = dutiesArray.slice(0, middleIdx);
  const middleLeft = getMiddleIdx(left);
  // console.log("left: " + left.map((o) => JSON.stringify(o).toString()));
  // console.log("middleLeft: " + middleLeft);
  if (!dutyRearranged.includes(left[middleLeft])) {
    dutyRearranged.push(left[middleLeft]);
    console.log("push: " + left[middleLeft].note);
  }

  const right = dutiesArray.slice(middleIdx, dutiesArray.length);
  const middleRight = getMiddleIdx(right);
  // console.log("right: " + right.map((o) => JSON.stringify(o).toString()));
  // console.log("middleRight: " + middleRight);
  if (!dutyRearranged.includes(right[middleRight])) {
    dutyRearranged.push(right[middleRight]);
    console.log("push: " + right[middleRight].note);
  }

  if (left.length > 1) {
    processRecursive(left, dutyRearranged);
  }
  if (right.length > 1) {
    processRecursive(right, dutyRearranged);
  }
};

export const ScheduleDuties = ({}) => {
  const [dutyType, setDutyType] = useState("normalDuty");
  const [practiceId, setPracticeId] = useState("");
  const duties = useDistrigardeStore((state) => state.duties);
  const practices = useDistrigardeStore((state) => state.practices);
  const modifyPracticeNbNormalDutiesToDo = useDistrigardeStore(
    (state) => state.modifyPracticeNbNormalDutiesToDo
  );
  const modifyPracticeNbShortlDutiesToDo = useDistrigardeStore(
    (state) => state.modifyPracticeNbShortDutiesToDo
  );
  const resetAllDutiesResponsible = useDistrigardeStore(
    (state) => state.resetAllDutiesResponsible
  );
  const setPractices = useDistrigardeStore((state) => state.setPractices);
  const setDuties = useDistrigardeStore((state) => state.setDuties);
  const practiceDisplayData = practices
    .map((p) => {
      return { value: p.id, label: p.name };
    })
    .concat({ value: "all", label: "Tous" });

  const autoScheduleOnePractice = (
    onePractice: Practice,
    someDuties: Duty[]
  ) => {
    const output = autoScheduleThisPractice(onePractice, someDuties, dutyType);
    if (dutyType === "shortDuty") {
      modifyPracticeNbShortlDutiesToDo(
        onePractice.id,
        onePractice.nbShortDutiesToDo - output.numberOfDutiesChanged
      );
    } else if (dutyType === "normalDuty") {
      modifyPracticeNbNormalDutiesToDo(
        onePractice.id,
        onePractice.nbNormalDutiesToDo - output.numberOfDutiesChanged
      );
    }
    return output.newDuties;
  };

  const autoProgramOnClickManager = () => {
    if (practiceId === "all") {
      let workingPractices: Practice[] = JSON.parse(JSON.stringify(practices));
      if (dutyType === "shortDuty") {
        workingPractices.sort(
          (p1, p2) => p2.nbShortDutiesToDo - p1.nbShortDutiesToDo // larget first
        );
        let workingDuties: Duty[] = JSON.parse(JSON.stringify(duties));
        for (const p of workingPractices) {
          workingDuties = autoScheduleOnePractice(p, workingDuties);
        }
        setDuties(workingDuties);
      } else if (dutyType === "normalDuty") {
        workingPractices.sort(
          (p1, p2) => p2.nbNormalDutiesToDo - p1.nbNormalDutiesToDo // larget first
        );
        let workingDuties: Duty[] = JSON.parse(JSON.stringify(duties));
        for (const p of workingPractices) {
          workingDuties = autoScheduleOnePractice(p, workingDuties);
        }
        setDuties(workingDuties);
      }
    } else {
      const onePractice = practices.find((x) => x.id === practiceId);
      if (onePractice) {
        setDuties(autoScheduleOnePractice(onePractice, duties));
      } else {
        console.log("Cannot find practice with id " + practiceId);
      }
    }
  };

  const reset = () => {
    resetAllDutiesResponsible();
    const updatedPractices = DoDistrbuteDuties(practices, duties);
    setPractices(updatedPractices);
  };

  return (
    <Stack>
      <Title order={2}>Programmer les gardes</Title>
      <Blockquote icon={<IconInfoCircle size={24} />}>
        <Title order={5}>Instructions</Title>
        <Text>
          Cliquer-glisser les gardes des cabinets jusqu'aux dates désirés, un
          par un, ou utilisez l'autoprogrammation plus bas.
        </Text>
        <Text>
          L'autoprogrammation considère la liste des gardes à faire comme un
          long collier de perle, et distribue les gardes en assignant une garde
          au milieu du collier, puis au milieu de la première moitié et au
          milieu de la deuxième moitié, puis au milieu du premier, deuxième,
          troisième et quatrième quart, etc.
        </Text>
      </Blockquote>
      <Group>
        <Select
          label="Cabinet"
          placeholder="Veuillez choisir un cabinet"
          data={practiceDisplayData}
          value={practiceId}
          onChange={(valStr: string) => setPracticeId(valStr)}
        />
        <Radio.Group
          name="dutyType"
          label="Choisir un type de garde"
          value={dutyType}
          onChange={setDutyType}
        >
          <Radio value="shortDuty" label="Garde courte" />
          <Radio value="normalDuty" label="Garde de weekend" />
        </Radio.Group>
        <Button onClick={autoProgramOnClickManager}>Auto-programmer1</Button>{" "}
        <Button onClick={reset}>Recommencer</Button>
      </Group>
      <Group>
        <Practices />
        <Duties />
      </Group>
    </Stack>
  );
};

const DutyRow = (props: { duty: Duty }) => {
  const { duty } = props;

  const modifyDutyResponsible = useDistrigardeStore(
    (state) => state.modifyDutyResponsible
  );
  const decrementPracticeNbNormalDutiesToDo = useDistrigardeStore(
    (state) => state.decrementPracticeNbNormalDutiesToDo
  );
  const decrementPracticeNbShortDutiesToDo = useDistrigardeStore(
    (state) => state.decrementPracticeNbShortDutiesToDo
  );
  const dutyLength = dayjs(duty.dateEnd).diff(dayjs(duty.dateStart), "days");

  const [{ canDrop, isOver }, dropRef] = useDrop({
    accept: "practiceToRow",
    drop: (item: PracticeToRow) => {
      modifyDutyResponsible(duty.id, item.practice);
      if (item.dutyType === "shortDuty") {
        decrementPracticeNbShortDutiesToDo(item.practice.id);
      }
      if (item.dutyType === "normalDuty") {
        decrementPracticeNbNormalDutiesToDo(item.practice.id);
      }
    },
    canDrop: (item: PracticeToRow) => {
      return (
        duty.responsible == null && //  this *has* to be == (instead of ===); I want to check for null and undefined at the same time
        ((item.dutyType === "shortDuty" && dutyLength === 0) ||
          (item.dutyType === "normalDuty" && dutyLength === 1))
      );
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const responsible = duty.responsible;

  const [{ isDragging }, dragRef] = useDrag({
    type: "rowToPractice",
    item: { responsible: duty.responsible, sourceDuty: duty },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const styleWhenHovered: React.CSSProperties = {
    border: "2px solid black",
  };
  const styleWhenCanDrop: React.CSSProperties = {
    border: "1px dashed black",
  };
  let style = {};

  if (canDrop) {
    if (isOver) {
      style = styleWhenHovered;
    } else {
      style = styleWhenCanDrop;
    }
    if (isDragging) {
      style = {
        background: "#eee",
      };
    }
  }

  const ref = useRef(null);
  dropRef(dragRef(ref));
  return (
    <tr key={duty.id} style={style} ref={ref}>
      <td>
        {dayjs(duty.dateStart).format("L")} – {dayjs(duty.dateEnd).format("L")}
      </td>
      <td>{duty.note}</td>
      <td>{duty.responsible?.name}</td>
    </tr>
  );
};
interface RowToPractice {
  responsible: Practice;
  sourceDuty: Duty;
}
const Duties = ({}) => {
  const duties = useDistrigardeStore((state) => state.duties);
  const rows = duties.map((d) => <DutyRow duty={d} />);
  return (
    <ScrollArea.Autosize maxHeight={800}>
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
    </ScrollArea.Autosize>
  );
};

const DraggableBoxShortDuty = (props: { practice: Practice }) => {
  const { practice } = props;
  const [{ isDragging }, dragRef, preview] = useDrag({
    type: "practiceToRow",
    item: {
      dutyType: "shortDuty",
      practice: practice,
      id: practice.id,
      icon: "📱",
    },
    canDrag: () => {
      return practice.nbShortDutiesToDo > 0;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
    }),
  });
  useEffect(() => {
    preview(getEmptyImage());
  }, []);
  let emoj = [];
  for (let i = 0; i < props.practice.nbShortDutiesToDo; i++) {
    emoj.push("📱");
  }

  const emojDisplay = emoj.join(" ");

  return (
    <>
      <Container
        sx={{
          padding: "1em",
          width: "12em",
          height: "4em",
          border: "1px solid black",
        }}
        ref={dragRef}
      >
        <Box>
          Petite garde
          {/* (<span ref={preview}>📱</span>) */}:
          {props.practice.nbShortDutiesToDo}
        </Box>

        <Box>{emojDisplay}</Box>
      </Container>
    </>
  );
};
interface PracticeToRow {
  dutyType: string;
  practice: Practice;
}
const DraggableBoxDuty = (props: { practice: Practice }) => {
  const { practice } = props;
  const [{ canDrag, isDragging }, dragRef, preview] = useDrag({
    type: "practiceToRow",
    item: {
      dutyType: "normalDuty",
      practice: practice,
      id: practice.id,
      icon: "☎️",
    },
    canDrag: () => {
      return practice.nbNormalDutiesToDo > 0;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
    }),
  });
  let emoj = [];
  for (let i = 0; i < props.practice.nbNormalDutiesToDo; i++) {
    emoj.push("☎️");
  }
  useEffect(() => {
    preview(getEmptyImage());
  }, []);

  const emojDisplay = emoj.join(" ");

  return (
    <>
      <Container
        sx={{
          padding: "1em",
          width: "12em",
          height: "4em",
          border: "1px solid black",
        }}
        ref={dragRef}
      >
        <Box>
          Garde
          {/* (<span ref={preview}>☎️</span>): */}
          {props.practice.nbNormalDutiesToDo}
        </Box>

        <Box>{emojDisplay}</Box>
      </Container>
      <CustomDragLayer />
    </>
  );
};

const CustomDragLayer = () => {
  const { isDragging, currentOffset, item } = useDragLayer(
    (monitor: DragLayerMonitor) => {
      return {
        isDragging: monitor.isDragging(),
        currentOffset: monitor.getSourceClientOffset(),
        item: monitor.getItem(),
      };
    }
  );

  return isDragging && currentOffset ? (
    <div
      style={{
        // functional
        transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",

        // design only
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1em",
        height: "1em",
        border: "1px solid red",
        color: "red",
      }}
    >
      {item.icon}
    </div>
  ) : null;
};
const Practices = ({}) => {
  const practices = useDistrigardeStore((state) => state.practices);
  const modifyDutyResponsible = useDistrigardeStore(
    (state) => state.modifyDutyResponsible
  );
  const incrementPracticeNbNormalDutiesToDo = useDistrigardeStore(
    (state) => state.incrementPracticeNbNormalDutiesToDo
  );
  const incrementPracticeNbShortDutiesToDo = useDistrigardeStore(
    (state) => state.incrementPracticeNbShortDutiesToDo
  );

  const [{ isOver }, dropRef] = useDrop({
    accept: "rowToPractice",
    drop: (item: RowToPractice) => {
      console.log("alpha");
      console.log(item);
      const dutyLength = dayjs(item.sourceDuty.dateEnd).diff(
        dayjs(item.sourceDuty.dateStart),
        "days"
      );
      if (dutyLength === 0) {
        incrementPracticeNbShortDutiesToDo(item.responsible.id);
      } else if (dutyLength === 1) {
        incrementPracticeNbNormalDutiesToDo(item.responsible.id);
      }
      modifyDutyResponsible(item.sourceDuty.id, null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  const rows = practices.map((p) => (
    <tr>
      <td>{p.name}</td>
      <td>
        <Stack key={p.id}>
          <DraggableBoxShortDuty practice={p} />
          <DraggableBoxDuty practice={p} />
        </Stack>
      </td>
    </tr>
  ));
  const styleWhenOvered = isOver ? { border: "2px solid black" } : {};
  const tableStyle = Object.assign(styleWhenOvered, { width: 300 });
  return (
    <div>
      <Table sx={tableStyle} ref={dropRef}>
        <thead style={{ fontWeight: "bold" }}>
          <tr>
            <td>Nom</td>
            <td>Gardes</td>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </div>
  );
};
