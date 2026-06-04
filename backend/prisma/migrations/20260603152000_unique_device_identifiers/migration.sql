CREATE UNIQUE INDEX "contracts_imei_unique_not_empty"
ON "contracts" (LOWER("imei"))
WHERE "imei" IS NOT NULL AND BTRIM("imei") <> '';

CREATE UNIQUE INDEX "contracts_serial_number_unique_not_empty"
ON "contracts" (LOWER("serial_number"))
WHERE "serial_number" IS NOT NULL AND BTRIM("serial_number") <> '';
