#!/usr/bin/env node

(async () => {
  process.env.DATABASE_SAFETY_LABEL ||= "local";
  process.env.CONFIRM_DESTRUCTIVE_DB_SCRIPT ||= "I_UNDERSTAND_THIS_DESTROYS_DATA";

  require("./reseed-entire-db");
})();
