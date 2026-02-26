import { describe, it, expect } from "vitest";
import { extractInvitationData } from "@/app/actions/invitations/_shared";

describe("extractInvitationData", () => {
  it("should extract and validate valid invitation data", () => {
    const formData = new FormData();
    formData.set("guestName", "Juan Pérez");
    formData.set("guestNickname", "Juancho");
    formData.set("guestPhone", "+541123456789");
    formData.set("maxGuests", "5");
    formData.set("hasResponded", "true");
    formData.set("isAttending", "true");
    formData.set("guestCount", "3");

    const result = extractInvitationData(formData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.guestName).toBe("Juan Pérez");
    expect(result.data?.maxGuests).toBe(5);
    expect(result.data?.guestCount).toBe(3);
  });

  it("should handle missing guestCount correctly", () => {
    const formData = new FormData();
    formData.set("guestName", "María García");
    formData.set("guestNickname", "");
    formData.set("guestPhone", "");
    formData.set("maxGuests", "2");
    formData.set("hasResponded", "false");
    formData.set("isAttending", "false");

    const result = extractInvitationData(formData);

    expect(result.success).toBe(true);
    expect(result.data?.guestCount).toBeNull();
  });

  it("should parse integers with radix 10 correctly", () => {
    const formData = new FormData();
    formData.set("guestName", "Test User");
    formData.set("guestNickname", "");
    formData.set("guestPhone", "");
    formData.set("maxGuests", "08"); // Would be octal in old JS
    formData.set("hasResponded", "true");
    formData.set("isAttending", "true");
    formData.set("guestCount", "010"); // Would be octal in old JS

    const result = extractInvitationData(formData);

    expect(result.success).toBe(true);
    expect(result.data?.maxGuests).toBe(8); // Not 0 (octal invalid)
    expect(result.data?.guestCount).toBe(10); // Not 8 (octal)
  });

  it("should reject invalid data", () => {
    const formData = new FormData();
    formData.set("guestName", ""); // Empty name is invalid
    formData.set("guestNickname", "");
    formData.set("guestPhone", "");
    formData.set("maxGuests", "0"); // 0 guests is invalid
    formData.set("hasResponded", "false");
    formData.set("isAttending", "false");

    const result = extractInvitationData(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should handle hexadecimal strings safely", () => {
    const formData = new FormData();
    formData.set("guestName", "Hex Test");
    formData.set("guestNickname", "");
    formData.set("guestPhone", "");
    formData.set("maxGuests", "0x10"); // 16 in hex
    formData.set("hasResponded", "false");
    formData.set("isAttending", "false");

    const result = extractInvitationData(formData);

    // With radix 10, "0x10" should be NaN, which will be caught by validation
    expect(result.success).toBe(false);
  });
});
