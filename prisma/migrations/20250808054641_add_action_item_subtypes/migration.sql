-- CreateTable
CREATE TABLE "public"."action_item" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "organizationId" TEXT,
    "personId" TEXT,
    "equipmentId" TEXT,
    "locationId" TEXT,
    "cafId" TEXT,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."action_note" (
    "actionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "action_note_pkey" PRIMARY KEY ("actionId")
);

-- CreateTable
CREATE TABLE "public"."action_attachment" (
    "actionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "action_attachment_pkey" PRIMARY KEY ("actionId")
);

-- CreateTable
CREATE TABLE "public"."action_url" (
    "actionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "action_url_pkey" PRIMARY KEY ("actionId")
);

-- CreateTable
CREATE TABLE "public"."action_credential" (
    "actionId" TEXT NOT NULL,
    "url" TEXT,
    "username" TEXT,
    "password" TEXT,

    CONSTRAINT "action_credential_pkey" PRIMARY KEY ("actionId")
);

-- CreateTable
CREATE TABLE "public"."action_task" (
    "actionId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "assignedToUser" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "action_task_pkey" PRIMARY KEY ("actionId")
);

-- CreateIndex
CREATE INDEX "action_item_issueId_idx" ON "public"."action_item"("issueId");

-- CreateIndex
CREATE INDEX "action_item_organizationId_idx" ON "public"."action_item"("organizationId");

-- CreateIndex
CREATE INDEX "action_item_personId_idx" ON "public"."action_item"("personId");

-- CreateIndex
CREATE INDEX "action_item_equipmentId_idx" ON "public"."action_item"("equipmentId");

-- CreateIndex
CREATE INDEX "action_item_locationId_idx" ON "public"."action_item"("locationId");

-- CreateIndex
CREATE INDEX "action_item_cafId_idx" ON "public"."action_item"("cafId");

-- CreateIndex
CREATE INDEX "action_item_actionType_createdAt_idx" ON "public"."action_item"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "action_task_status_dueAt_idx" ON "public"."action_task"("status", "dueAt");

-- AddForeignKey
ALTER TABLE "public"."action_item" ADD CONSTRAINT "action_item_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_item" ADD CONSTRAINT "action_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_item" ADD CONSTRAINT "action_item_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_item" ADD CONSTRAINT "action_item_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_item" ADD CONSTRAINT "action_item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_item" ADD CONSTRAINT "action_item_cafId_fkey" FOREIGN KEY ("cafId") REFERENCES "public"."corrective_action_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_note" ADD CONSTRAINT "action_note_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."action_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_attachment" ADD CONSTRAINT "action_attachment_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."action_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_url" ADD CONSTRAINT "action_url_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."action_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_credential" ADD CONSTRAINT "action_credential_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."action_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_task" ADD CONSTRAINT "action_task_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."action_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
