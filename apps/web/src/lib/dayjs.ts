import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/fr";
import { i18n } from "@lingui/core";

dayjs.extend(localizedFormat);
dayjs.locale(i18n.locale);

i18n.on("change", () => {
  dayjs.locale(i18n.locale);
});
