-- CreateTable
CREATE TABLE "profile_views" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "viewer_id" UUID,
    "viewer_role" TEXT,
    "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_views_teacher_id_viewed_at_idx" ON "profile_views"("teacher_id", "viewed_at" DESC);

-- CreateIndex
CREATE INDEX "profile_views_viewer_id_idx" ON "profile_views"("viewer_id");

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
