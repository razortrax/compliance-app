-- AddForeignKey
ALTER TABLE "public"."incident_violation" ADD CONSTRAINT "incident_violation_violationCode_fkey" FOREIGN KEY ("violationCode") REFERENCES "public"."violation_code"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
