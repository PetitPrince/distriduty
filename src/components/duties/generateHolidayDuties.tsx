import dayjs from "dayjs";
import { gregorian as computeEasterForYear } from "@pacote/computus";
import { HolidayStatus, Duty, DutyConstructor } from "./Duties";

export const generateHolidayDuties = (
  activeHolidays: HolidayStatus,
  year: number
) => {
  let defaultDuties: Duty[] = [];
  // Add holiday
  for (const [thisHoliday, wereDoingIt] of Object.entries(activeHolidays)) {
    if (wereDoingIt) {
      let newDuty;
      switch (thisHoliday) {
        case "nouvelAn":
          const januaryFirst = dayjs(String(year) + "-01-01", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            januaryFirst.toDate(),
            januaryFirst.toDate(),
            "Nouvel an"
          );
          break;
        case "saintBerchtold":
          const januarySecond = dayjs(String(year) + "-01-02", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            januarySecond.toDate(),
            januarySecond.toDate(),
            "Saint Berchtold"
          );
          break;
        case "epiphanie":
          const januraySixth = dayjs(String(year) + "-01-06", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            januraySixth.toDate(),
            januraySixth.toDate(),
            "Epiphanie"
          );
          break;
        case "republiqueNeuchatel":
          const marchFirst = dayjs(String(year) + "-03-01", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            marchFirst.toDate(),
            marchFirst.toDate(),
            "Instauration de la République de Neuchatel"
          );
          break;
        case "saintJoseph":
          const marchNinteeth = dayjs(String(year) + "-03-19", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            marchNinteeth.toDate(),
            marchNinteeth.toDate(),
            "Saint-Joseph"
          );
          break;
        case "fahrtsfest":
          const firstTuesdayOfMarch = dayjs(String(year) + "-03", "YYYY-MM")
            .startOf("week")
            .add(4, "days");
          newDuty = DutyConstructor(
            firstTuesdayOfMarch.toDate(),
            firstTuesdayOfMarch.toDate(),
            "Fahrtsfest"
          );
          break;
        case "vendrediSaint":
          {
            const easter = dayjs(computeEasterForYear(year));
            const twoDaysBeforeEaster = easter.subtract(2, "days");
            newDuty = DutyConstructor(
              twoDaysBeforeEaster.toDate(),
              twoDaysBeforeEaster.toDate(),
              "Vendredi Saint"
            );
          }
          break;
        case "lundiDePaques":
          {
            const easter = dayjs(computeEasterForYear(year));
            const oneDayAfterEaster = easter.add(1, "day");
            newDuty = DutyConstructor(
              oneDayAfterEaster.toDate(),
              oneDayAfterEaster.toDate(),
              "Lundi de Pâques"
            );
          }
          break;
        case "ascenscion":
          {
            const easter = dayjs(computeEasterForYear(year));
            const fourDaysAfterEaster = easter.add(4, "days");
            newDuty = DutyConstructor(
              fourDaysAfterEaster.toDate(),
              fourDaysAfterEaster.toDate(),
              "Ascenscion"
            );
          }
          break;
        case "feteDuTravail":
          const mayFirst = dayjs(String(year) + "-04-01", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            mayFirst.toDate(),
            mayFirst.toDate(),
            "Fête du travail"
          );
          break;
        case "pentecote":
          {
            const easter = dayjs(computeEasterForYear(year));
            const fourtyNineDaysAfterEaster = easter.add(49, "days");
            newDuty = DutyConstructor(
              fourtyNineDaysAfterEaster.toDate(),
              fourtyNineDaysAfterEaster.toDate(),
              "Pentecôte"
            );
          }
          break;
        case "feteDieu":
          {
            const easter = dayjs(computeEasterForYear(year));
            const sixtyDaysAfterEaster = easter.add(60, "days");
            newDuty = DutyConstructor(
              sixtyDaysAfterEaster.toDate(),
              sixtyDaysAfterEaster.toDate(),
              "Fête-Dieu"
            );
          }
          break;
        case "plebisciteJura":
          const juneTwentyThird = dayjs(String(year) + "-06-23", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            juneTwentyThird.toDate(),
            juneTwentyThird.toDate(),
            "Commémoration du plébiscite Jurassien"
          );
          break;
        case "saintPierreEtPaul":
          const juneTwentyNine = dayjs(String(year) + "-06-29", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            juneTwentyNine.toDate(),
            juneTwentyNine.toDate(),
            "Saint-Pierre et Paul"
          );
          break;
        case "feteNationale":
          const augustFirst = dayjs(String(year) + "-08-01", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            augustFirst.toDate(),
            augustFirst.toDate(),
            "Fête Nationale"
          );
          break;
        case "assomption":
          const augustFifteen = dayjs(String(year) + "-08-15", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            augustFifteen.toDate(),
            augustFifteen.toDate(),
            "Assomption"
          );
          break;
        case "jeuneGeneve":
          const thursdayFollowingSeptemberFirstSunday = dayjs(
            String(year) + "-07-01",
            "YYYY-MM-DD"
          )
            .startOf("week")
            .add(7 + 4, "days"); // 7: sunday, +4: thursday
          newDuty = DutyConstructor(
            thursdayFollowingSeptemberFirstSunday.toDate(),
            thursdayFollowingSeptemberFirstSunday.toDate(),
            "Jeûne Genevois"
          );
          break;
        case "jeunefederal":
          const mondayAfterTheThirdSundayOfSeptember = dayjs(
            String(year) + "-07-01",
            "YYYY-MM-DD"
          )
            .startOf("week")
            .add(7 + 2 * 7 + 1, "days");
          newDuty = DutyConstructor(
            mondayAfterTheThirdSundayOfSeptember.toDate(),
            mondayAfterTheThirdSundayOfSeptember.toDate(),
            "Jeûne Fédéral"
          );
          break;
        case "saintNicolasDeFlue":
          const septemberTwentyFive = dayjs(
            String(year) + "-09-25",
            "YYYY-MM-DD"
          );
          newDuty = DutyConstructor(
            septemberTwentyFive.toDate(),
            septemberTwentyFive.toDate(),
            "Fête de Saint-Nicolas-de-Flüe"
          );
          break;
        case "toussaint":
          const novemberFirst = dayjs(String(year) + "-11-01", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            novemberFirst.toDate(),
            novemberFirst.toDate(),
            "Toussaint"
          );
          break;
        case "immaculeeConception":
          const decemberEigth = dayjs(String(year) + "-12-08", "YYYY-MM-DD");
          newDuty = DutyConstructor(
            decemberEigth.toDate(),
            decemberEigth.toDate(),
            "Immaculée Conception"
          );
          break;
        case "noel":
          const decemberTwentyFifth = dayjs(
            String(year) + "-12-25",
            "YYYY-MM-DD"
          );
          newDuty = DutyConstructor(
            decemberTwentyFifth.toDate(),
            decemberTwentyFifth.toDate(),
            "Noël"
          );
          break;
        case "saintEtienne":
          const decemberTwentySix = dayjs(
            String(year) + "-12-26",
            "YYYY-MM-DD"
          );
          newDuty = DutyConstructor(
            decemberTwentySix.toDate(),
            decemberTwentySix.toDate(),
            "Saint-Etienne"
          );
          break;
        case "restaurationRepubliquegeneve":
          const decemberThirthyFirst = dayjs(
            String(year) + "-12-31",
            "YYYY-MM-DD"
          );
          newDuty = DutyConstructor(
            decemberThirthyFirst.toDate(),
            decemberThirthyFirst.toDate(),
            "Restauration de la République de Genève"
          );
          break;
        default:
          console.log("Unknown holiday: " + thisHoliday);
          break;
      }
      if (newDuty) {
        defaultDuties.push(newDuty);
      }
    }
  }
  return defaultDuties;
};
