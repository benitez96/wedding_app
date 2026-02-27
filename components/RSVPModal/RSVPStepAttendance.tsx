"use client";

import CustomRadioGroup from "@/components/sections/RSVPStatus/CustomRadioGroup";
import { RSVPAttendanceStep } from "@/components/sections/RSVPSection/RSVPSection.metadata";
import type { AttendanceValue } from "@/lib/rsvp-modal-utils";

interface RSVPStepAttendanceProps {
  value: AttendanceValue | null;
  onValueChange: (value: AttendanceValue) => void;
  attendanceStep: RSVPAttendanceStep;
}

// Step 1: Will you attend? — always shown, texts fully configurable
export function RSVPStepAttendance({
  value,
  onValueChange,
  attendanceStep,
}: RSVPStepAttendanceProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-center">{attendanceStep.question}</h4>
      <CustomRadioGroup
        value={value}
        onValueChange={onValueChange}
        acceptText={{
          label: attendanceStep.acceptLabel,
          subtitle: attendanceStep.acceptSubtitle,
        }}
        declineText={{
          label: attendanceStep.declineLabel,
          subtitle: attendanceStep.declineSubtitle,
        }}
      />
    </div>
  );
}
