-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
