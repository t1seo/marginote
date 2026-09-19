import { config } from "zod/mini";
import en from "zod/v4/locales/en.js";

if (!config().localeError) config(en());
