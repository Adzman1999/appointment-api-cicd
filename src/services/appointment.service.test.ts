import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPool, mockClient, repo } = vi.hoisted(() => {
    const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
    };
    return {
        mockClient,
        mockPool: {
            connect: vi.fn(),
        },
        repo: {
            userExists: vi.fn(),
            findSlotForUpdate: vi.fn(),
            activeBookingExists: vi.fn(),
            insertBooking: vi.fn(),
            findBookingForUpdate: vi.fn(),
            cancelBooking: vi.fn(),
        },
    };
});

vi.mock("../db/pool.js", () => ({
    pool: mockPool,
}));

vi.mock("../repositories/appointment.repository.js", () => repo);

import {
    bookAppointment,
    cancelAppointment,
} from "./appointment.service.js";

function appErrorStatus(error: unknown): number | undefined {
    if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
    ) {
        return error.statusCode;
    }

    return undefined;
}

describe("Appointment service", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        mockPool.connect.mockResolvedValue(mockClient);
        mockClient.query.mockResolvedValue({ rows: [] });

        repo.userExists.mockResolvedValue(true);
        repo.findSlotForUpdate.mockResolvedValue({
            id: 10,
            starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            ends_at: new Date(Date.now() + 25 * 60 * 60 * 1000),
        });
        repo.activeBookingExists.mockResolvedValue(false);
        repo.insertBooking.mockResolvedValue({
            id: 101,
            user_id: 1,
            slot_id: 10,
            status: "booked",
        });
    });

    it("books a future slot and commits the transaction", async () => {
        const result = await bookAppointment(1, 10);

        expect(repo.userExists).toHaveBeenCalledWith(mockClient, 1);
        expect(repo.findSlotForUpdate).toHaveBeenCalledWith(mockClient, 10);
        expect(repo.insertBooking).toHaveBeenCalledWith(mockClient, 1, 10);
        expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
        expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
        expect(mockClient.release).toHaveBeenCalled();
        expect(result).toEqual(
            expect.objectContaining({ status: "booked" }),
        );
    });

    it("rejects booking when the user does not exist", async () => {
        repo.userExists.mockResolvedValue(false);

        await expect(bookAppointment(999, 10)).rejects.toMatchObject({
            statusCode: 404,
        });

        expect(repo.insertBooking).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
        expect(mockClient.release).toHaveBeenCalled();
    });

    it("rejects booking when the slot is already booked", async () => {
        repo.activeBookingExists.mockResolvedValue(true);

        await expect(bookAppointment(1, 10)).rejects.toMatchObject({
            statusCode: 409,
        });

        expect(repo.insertBooking).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
        expect(mockClient.release).toHaveBeenCalled();
    });

    it("rejects a slot that is in the past", async () => {
        repo.findSlotForUpdate.mockResolvedValue({
            id: 10,
            starts_at: new Date(Date.now() - 60_000),
            ends_at: new Date(Date.now() + 60_000),
        });

        await expect(bookAppointment(1, 10)).rejects.toMatchObject({
            statusCode: 400,
        });

        expect(repo.insertBooking).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("rolls back if inserting a booking fails", async () => {
        repo.insertBooking.mockRejectedValue(new Error("database failure"));

        await expect(bookAppointment(1, 10)).rejects.toThrow(
            "database failure",
        );

        expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
        expect(mockClient.release).toHaveBeenCalled();
    });

    it("rejects cancellation when the appointment belongs to another user", async () => {
        repo.findBookingForUpdate.mockResolvedValue({
            id: 101,
            user_id: 2,
            slot_id: 10,
            status: "booked",
        });

        await expect(cancelAppointment(1, 101)).rejects.toMatchObject({
            statusCode: 403,
        });

        expect(repo.cancelBooking).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
        expect(mockClient.release).toHaveBeenCalled();
    });

    it("rejects cancellation when the appointment does not exist", async () => {
        repo.findBookingForUpdate.mockResolvedValue(null);

        await expect(cancelAppointment(1, 999)).rejects.toMatchObject({
            statusCode: 404,
        });

        expect(repo.cancelBooking).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });
});
