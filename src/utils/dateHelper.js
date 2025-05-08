// src/utils/dateHelper.js
import dayjs from "dayjs";

export const formatDate = (date, format = "DD/MM/YYYY") => {
  return date ? dayjs(date).format(format) : "N/A";
};
