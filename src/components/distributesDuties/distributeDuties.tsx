import {
  ActionIcon,
  Button,
  Checkbox,
  Container,
  Group,
  NumberInput,
  Stack,
  Table,
  TextInput,
  Text,
  Title,
  Center,
  Slider,
  Blockquote,
  RingProgress,
  Progress,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons";
import dayjs from "dayjs";
import produce from "immer";
import { useState } from "react";
import seedrandom from "seedrandom";
import { UrlWithStringQuery } from "url";
import { Duty } from "../duties/Duties";
import { Practice, useDistrigardeStore } from "../store/Store";
const groupBy = <T, K extends keyof any>(
  list: T[],
  getKey: (item: T) => K // thanks https://stackoverflow.com/questions/42136098/array-groupby-in-typescript
) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);

function getAllIndexes(arr: number[], val: any) {
  //https://stackoverflow.com/questions/20798477/how-to-find-index-of-all-occurrences-of-element-in-array
  var indexes = [],
    i;
  for (i = 0; i < arr.length; i++) if (arr[i] === val) indexes.push(i);
  return indexes;
}
const generateAllocation = (
  nIndivisibleItems: number,
  groupPercentages: number[],
  seed: string,
  correctDelta: boolean = true
) => {
  let allocations: number[] = [];
  var rng = seedrandom(seed);

  for (const percentage of groupPercentages) {
    const naiveAllocation = nIndivisibleItems * percentage;
    const naivedRoundedAllocation = Math.round(naiveAllocation);
    allocations.push(naivedRoundedAllocation);
  }

  // It is guaranteeed by definitation that sum(naiveAllocations) === nIndivisibleItems
  // But this is not the case for naivedRoundedAllocation
  // Experimentally, for my particular dataset where
  // groups = [{weight: 70}, {weight: 90},{weight: 90}, {weight: 160},{weight: 120}]
  // which correspond to
  // groups = [{percentage: 13}, {percentage: 17}, {percentage: 17}, {percentage: 30}, {percentage: 23}]
  // the allocation delta for n=[0,100] is bound between [-1,0,1], i.e. sometimes
  // there one allocation too many, and sometime one allocation too few.
  const summedAllocation = allocations.reduce((sum, val) => sum + val, 0);

  if (correctDelta) {
    const deltaAllocation = nIndivisibleItems - summedAllocation;
    if (deltaAllocation === 1) {
      // one item too few
      const minValue = Math.min(...allocations);
      const indexesOfMinVal = getAllIndexes(allocations, minValue);
      const randomIdxOfMinVal = Math.floor(rng() * indexesOfMinVal.length);
      const randomIdxToIncrement = indexesOfMinVal[randomIdxOfMinVal];
      allocations[randomIdxToIncrement]++;
    }
    if (deltaAllocation === -1) {
      // one item too many{
      const maxValue = Math.max(...allocations);
      const indexesOfMaxVal = getAllIndexes(allocations, maxValue);
      const randomIdxOfMaxVal = Math.floor(rng() * indexesOfMaxVal.length);
      const randomIdxToDecrement = indexesOfMaxVal[randomIdxOfMaxVal];
      allocations[randomIdxToDecrement]--;
    }
  }

  return allocations;
};

export const DoDistrbuteDuties = (practices: Practice[], duties: Duty[]) => {
  const seed = "bla";
  let workingCopyPractices: Practice[] = JSON.parse(JSON.stringify(practices));

  const dutiesLength = duties.map(
    (d) => dayjs(d.dateEnd).diff(dayjs(d.dateStart), "days") + 1
  );

  const numberOfOnes = dutiesLength.filter((d) => d === 1).length;
  const numberOfTwos = dutiesLength.filter((d) => d === 2).length;

  const numberOfShortDuties = numberOfOnes;
  const numberOfNormalDuties = numberOfTwos;

  const practicesSharingDuties = workingCopyPractices.filter(
    (p) => !p.isIgnoredInCount
  );
  const practicesNotSharingDuties = workingCopyPractices.filter(
    (p) => p.isIgnoredInCount
  );

  const practiceSummedWeights = practicesSharingDuties
    .map((p) => p.employeePercentage)
    .reduce((sum, val) => sum + val, 0);
  const practicePercentageOfShare = practicesSharingDuties.map(
    (p) => p.employeePercentage / practiceSummedWeights
  );

  const distributionOfShort = generateAllocation(
    numberOfShortDuties,
    practicePercentageOfShare,
    seed
  );
  const distributionOfNormal = generateAllocation(
    numberOfNormalDuties,
    practicePercentageOfShare,
    seed
  );
  for (let i = 0; i < practicesSharingDuties.length; i++) {
    let practice = practicesSharingDuties[i];
    practice.nbShortDutiesToDo = distributionOfShort[i];
    practice.nbNormalDutiesToDo = distributionOfNormal[i];
  }
  return workingCopyPractices;
};

const PracticeRow = (props: {
  practiceName: string;
  practiceId: string;
  percentageOfShare: number;
  nbShortDutiesToDo: number;
  effectivePercentageShortDuties: number;
  nbNormalDutiesToDo: number;
  effectivePercentageNormalDuties: number;
}) => {
  const modifyPracticeNbShortDutiesToDo = useDistrigardeStore(
    (state) => state.modifyPracticeNbShortDutiesToDo
  );
  const modifyPracticeNbNormalDutiesToDo = useDistrigardeStore(
    (state) => state.modifyPracticeNbNormalDutiesToDo
  );
  const {
    practiceName,
    practiceId,
    percentageOfShare,
    effectivePercentageShortDuties,
    effectivePercentageNormalDuties,
    nbShortDutiesToDo,
    nbNormalDutiesToDo,
  } = props;

  return (
    <tr>
      <td>{practiceName}</td>
      {/* <td>{(100 * percentageOfShare).toFixed(2).toString()}</td> */}
      <td>
        <NumberInput
          value={nbShortDutiesToDo}
          onChange={(val: number) =>
            modifyPracticeNbShortDutiesToDo(practiceId, val)
          }
        />
      </td>{" "}
      <td>
        {
          <NumberInput
            value={nbNormalDutiesToDo}
            onChange={(val: number) =>
              modifyPracticeNbNormalDutiesToDo(practiceId, val)
            }
          />
        }
      </td>
      {/* <td>
        <Group>
           <Text>
            {(100 * effectivePercentageShortDuties).toFixed(1).toString()}
          </Text>
          <Slider
            sx={{ flexGrow: 4 }}
            styles={(theme) => ({
              bar: {
                transition: "all 1s",
              },
            })}
            value={100 * effectivePercentageShortDuties}
            label={(100 * effectivePercentageShortDuties).toFixed(1).toString()}
            marks={[
              {
                value: 100 * percentageOfShare,
                label: (100 * percentageOfShare).toFixed(1).toString(),
              },
            ]}
            max={100 * percentageOfShare + 5}
          />
        </Group>
      </td> */}
      {/* <td>{(100 * effectivePercentageNormalDuties).toFixed(2).toString()}</td>  */}
    </tr>
  );
};

export const DistributeDuties = (props: {}) => {
  const practices = useDistrigardeStore((state) => state.practices);
  const duties = useDistrigardeStore((state) => state.duties);

  const setPractices = useDistrigardeStore((state) => state.setPractices);

  let displayRows: any = [];
  const dutiesLength = duties.map(
    (d) => dayjs(d.dateEnd).diff(dayjs(d.dateStart), "days") + 1
  );

  const numberOfOnes = dutiesLength.filter((d) => d === 1).length;
  const numberOfTwos = dutiesLength.filter((d) => d === 2).length;

  const numberOfNormalDuties = numberOfTwos;
  const numberOfShortDuties = numberOfOnes;

  const distributeButtonHandler = () => {
    const updatedPractices = DoDistrbuteDuties(practices, duties);
    setPractices(updatedPractices);
  };

  const resetDistribution = () => {
    let workingPractices: Practice[] = JSON.parse(JSON.stringify(practices));
    for (const practice of workingPractices) {
      practice.nbNormalDutiesToDo = 0;
      practice.nbShortDutiesToDo = 0;
    }
    setPractices(workingPractices);
  };
  const practiceSummedWeights = practices
    .filter((p) => !p.isIgnoredInCount)
    .map((p) => p.employeePercentage)
    .reduce((sum, val) => sum + val, 0);

  const allPercentageOfShare: number[] = [];
  const allEffectivePercentageShortDuties: number[] = [];
  const allEffectivePercentageNormalDuties: number[] = [];
  const allNbShortDuties: number[] = [];
  const allNbNormalDuties: number[] = [];
  for (const practice of practices) {
    const percentageOfShare =
      practice.employeePercentage / practiceSummedWeights;
    const effectivePercentageShortDuties =
      practice.nbShortDutiesToDo / numberOfShortDuties;
    const effectivePercentageNormalDuties =
      practice.nbNormalDutiesToDo / numberOfNormalDuties;
    allPercentageOfShare.push(percentageOfShare);
    allEffectivePercentageShortDuties.push(effectivePercentageShortDuties);
    allEffectivePercentageNormalDuties.push(effectivePercentageNormalDuties);
    allNbShortDuties.push(practice.nbShortDutiesToDo);
    allNbNormalDuties.push(practice.nbNormalDutiesToDo);

    displayRows.push(
      <PracticeRow
        practiceName={practice.name}
        practiceId={practice.id}
        percentageOfShare={percentageOfShare}
        effectivePercentageShortDuties={effectivePercentageShortDuties}
        effectivePercentageNormalDuties={effectivePercentageNormalDuties}
        nbShortDutiesToDo={practice.nbShortDutiesToDo}
        nbNormalDutiesToDo={practice.nbNormalDutiesToDo}
        key={"pr" + practice.id}
      />
    );
  }

  const colorsFrac = allPercentageOfShare.length
    ? 360 / allPercentageOfShare.length
    : 0;

  let progressSectionsIdeal = [];
  let progressSectionsEffectiveShort = [];
  let progressSectionsEffectiveNormal = [];

  for (let idx = 0; idx < allPercentageOfShare.length; idx++) {
    const percentageOfShareDisplay = allPercentageOfShare[idx] * 100;
    progressSectionsIdeal.push({
      value: parseInt(percentageOfShareDisplay.toFixed(0)),
      label:
        practices[idx].id + " : " + percentageOfShareDisplay.toFixed(0) + "%",
      color: "hsl(" + colorsFrac * idx + ",35%,50%)",
    });
    const percentageOfShareShortDisplay =
      allEffectivePercentageShortDuties[idx] * 100;

    progressSectionsEffectiveShort.push({
      value: parseInt(percentageOfShareShortDisplay.toFixed(0)),
      label:
        practices[idx].id +
        " : " +
        percentageOfShareShortDisplay.toFixed(0) +
        "%",
      color: "hsl(" + colorsFrac * idx + ",85%,30%)",
    });
    const percentageOfShareNormalDisplay =
      allEffectivePercentageNormalDuties[idx] * 100;

    progressSectionsEffectiveNormal.push({
      value: parseInt(percentageOfShareNormalDisplay.toFixed(0)),
      label:
        practices[idx].id +
        " : " +
        percentageOfShareNormalDisplay.toFixed(0) +
        "%",
      color: "hsl(" + colorsFrac * idx + ",85%,30%)",
    });
  }

  const sumPercentageOfShare = allPercentageOfShare.reduce(
    (sum, val) => sum + val,
    0
  );
  const sumEffectivePercentageShortDuties =
    allEffectivePercentageShortDuties.reduce((sum, val) => sum + val, 0);
  const sumEffectivePercentageNormalDuties =
    allEffectivePercentageNormalDuties.reduce((sum, val) => sum + val, 0);
  const sumNbShortDuties = allNbShortDuties.reduce((sum, val) => sum + val, 0);
  const sumNbNormalDuties = allNbNormalDuties.reduce(
    (sum, val) => sum + val,
    0
  );

  const percentageOfDistributedShortDuties =
    (100 * sumNbShortDuties) / numberOfShortDuties;
  const colorOfDistributedShortDuties =
    percentageOfDistributedShortDuties === 100 ? "green" : "blue";

  const percentageOfDistributedDuties =
    (100 * sumNbNormalDuties) / numberOfNormalDuties;
  const colorOfDistributedDuties =
    percentageOfDistributedDuties === 100 ? "green" : "blue";

  return (
    <Stack>
      <Title order={2}> Déterminer le nombre de garde</Title>
      <Blockquote icon={<IconInfoCircle size={24} />}>
        <Title order={5}>Instructions</Title>
        <Text>Distribuer les gardes parmis les différents cabinets.</Text>
      </Blockquote>
      {/* <TextInput
        value={seed}
        onChange={(event) => setSeed(event.currentTarget.value)}
        label="Seed"
      /> */}
      <Stack>
        {/* <Container>{bar}</Container> */}
        <Center>
          <Group>
            <Stack align="center">
              <Text>Petite garde à distribuer</Text>
              <RingProgress
                sections={[
                  {
                    value: percentageOfDistributedShortDuties,
                    color: colorOfDistributedShortDuties,
                  },
                ]}
                label={
                  <Text align="center">
                    {sumNbShortDuties} / {numberOfShortDuties}
                  </Text>
                }
              />
            </Stack>

            <Stack align="center">
              <Text>Garde de weekend à distribuer</Text>
              <RingProgress
                sections={[
                  {
                    value: percentageOfDistributedDuties,
                    color: colorOfDistributedDuties,
                  },
                ]}
                label={
                  <Text align="center">
                    {sumNbNormalDuties} / {numberOfNormalDuties}
                  </Text>
                }
              />
            </Stack>
          </Group>
        </Center>
        <Table>
          <tbody>
            <tr>
              <td align="right">Répartition idéale</td>
              <td style={{ minWidth: "50em" }}>
                <Progress
                  mt="md"
                  size="xl"
                  radius="xl"
                  sections={progressSectionsIdeal}
                />
              </td>
            </tr>
            <tr>
              <td align="right">Petite garde</td>
              <td>
                <Progress
                  mt="md"
                  size="xl"
                  radius="xl"
                  sections={progressSectionsEffectiveShort}
                />
              </td>
            </tr>
            <tr>
              <td align="right">Garde normale</td>
              <td>
                <Progress
                  mt="md"
                  size="xl"
                  radius="xl"
                  sections={progressSectionsEffectiveNormal}
                />
              </td>{" "}
            </tr>
          </tbody>
        </Table>
        <Center>
          <Group>
            <Button onClick={distributeButtonHandler}>
              Distribuer automatiquement
            </Button>
            <Button onClick={resetDistribution}>Remettre à zéro</Button>
          </Group>
        </Center>
        <Table>
          <thead>
            <tr key="distribhead">
              <td>Cabinet</td>
              {/* <td>Pourcentage théorique de garde à faire</td> */}
              <td>Nombre de petites gardes à faire</td>
              <td>Nombre de gardes à faire</td>
              {/* <td>Pourcentage (petite garde)</td>
              <td>Pourcentage (garde normale)</td> */}
            </tr>
          </thead>
          <tbody>
            {displayRows}

            <tr>
              <td>Total</td>
              <td>{sumNbShortDuties}</td>
              <td>{sumNbNormalDuties}</td>
              {/* <td>{(sumPercentageOfShare * 100).toFixed(2)}</td>
              <td>{(sumEffectivePercentageShortDuties * 100).toFixed(2)}</td>
              <td>{(sumEffectivePercentageNormalDuties * 100).toFixed(2)}</td> */}
            </tr>
          </tbody>
        </Table>
      </Stack>
    </Stack>
  );
};
