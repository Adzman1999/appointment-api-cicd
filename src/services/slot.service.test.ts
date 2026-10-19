import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockPool, mockClient, slotRepo } = vi.hoisted(() => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  return {
    mockClient,
    mockPool: {
      connect: vi.fn(),
    },
    slotRepo: {
      listAllSlots: vi.fn(),
      holdSlot: vi.fn(),
      releaseHold: vi.fn(),
    },
  };
});

vi.mock("../db/pool.js", () => ({ pool: mockPool }));
vi.mock("../repositories/slot.repository.js", () => slotRepo);

import {
  cancelSlotHold,
  getSlots,
  reserveSlotHold,
} from "./slot.service.js";

describe("Slot Hold Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
  });

  it("lists all slots with active hold status", async () => {
    const mockSlots = [
      {
        id: 1,
        provider_name: "Dr. Sarah",
        specialty: "Cardiology",
        starts_at: "2026-10-20T09:00:00Z",
        ends_at: "2026-10-20T09:30:00Z",
        status: "available",
      },
    ];
    slotRepo.listAllSlots.mockResolvedValue(mockSlots);

    const result = await getSlots(1);
    expect(slotRepo.listAllSlots).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockSlots);
  });

  it("successfully reserves a 3-minute hold on an available slot", async () => {
    const heldSlot = {
      id: 5,
      provider_id: 1,
      status: "held",
      held_by_user_id: 2,
      held_until: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    };
    slotRepo.holdSlot.mockResolvedValue(heldSlot);

    const result = await reserveSlotHold(5, 2, 3);

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(slotRepo.holdSlot).toHaveBeenCalledWith(mockClient, 5, 2, 3);
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
    expect(result).toEqual(heldSlot);
  });

  it("throws 409 Conflict if slot is already held or booked", async () => {
    slotRepo.holdSlot.mockResolvedValue(null);

    await expect(reserveSlotHold(5, 2, 3)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("releases hold when cancelled by the slot holder", async () => {
    slotRepo.releaseHold.mockResolvedValue(true);

    const result = await cancelSlotHold(5, 2);

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(slotRepo.releaseHold).toHaveBeenCalledWith(mockClient, 5, 2);
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(result).toEqual({ success: true, message: "Hold released successfully" });
  });

  it("throws 404 if hold cannot be released or is not owned by user", async () => {
    slotRepo.releaseHold.mockResolvedValue(false);

    await expect(cancelSlotHold(5, 99)).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
  });
});
