import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/fr";
import i18next from "@/i18n";

dayjs.extend(localizedFormat);
dayjs.locale(i18next.language);

i18next.on("languageChanged", (lng) => {
  dayjs.locale(lng);
});
