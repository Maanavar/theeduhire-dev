-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "day_reminder_sent_at" TIMESTAMPTZ,
ADD COLUMN     "hour_reminder_sent_at" TIMESTAMPTZ;
