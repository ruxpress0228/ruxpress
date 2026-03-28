import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../utils/api";
import {
  getPublicSettlementAccounts,
  reportDeposit,
  adminListLedgerEntries,
  adminDeleteSettlementAccount,
} from "./bankTransfer";

vi.mock("../utils/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockAccount = (id: number): import("../types/bankTransfer").SettlementAccount => ({
  id,
  bankName: "TestBank",
  accountNumber: "****1234",
  accountHolder: "Holder",
  displayMemo: null,
  active: true,
});

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  vi.mocked(api.put).mockReset();
  vi.mocked(api.delete).mockReset();
});

describe("bankTransfer API", () => {
  it("getPublicSettlementAccounts calls GET settlement-accounts and returns data", async () => {
    const data = [mockAccount(1)];
    vi.mocked(api.get).mockResolvedValue({ code: 200, message: "OK", data });

    const result = await getPublicSettlementAccounts();

    expect(api.get).toHaveBeenCalledWith("/v1/bank-transfers/settlement-accounts");
    expect(result).toEqual(data);
  });

  it("getPublicSettlementAccounts throws when code is not 200", async () => {
    vi.mocked(api.get).mockResolvedValue({ code: 400, message: "bad", data: [] });

    await expect(getPublicSettlementAccounts()).rejects.toThrow("bad");
  });

  it("getPublicSettlementAccounts throws when data is null (uses server message)", async () => {
    vi.mocked(api.get).mockResolvedValue({ code: 200, message: "OK", data: null });

    await expect(getPublicSettlementAccounts()).rejects.toThrow("OK");
  });

  it("reportDeposit POSTs deposit-reports body", async () => {
    const entry = {
      id: 10,
      userId: 1,
      settlementAccountId: 2,
      entryType: "ESCROW_HOLD" as const,
      status: "PENDING" as const,
      amount: 5000,
      currency: "KRW",
      depositorName: null,
      depositorMemo: null,
      adminMemo: null,
      refType: null,
      refId: null,
      parentEntryId: null,
      confirmedAt: null,
      confirmedByAdminId: null,
      createdAt: "2026-01-01T00:00:00Z",
      settlementAccount: mockAccount(2),
    };
    vi.mocked(api.post).mockResolvedValue({ code: 200, message: "OK", data: entry });

    const body = {
      settlementAccountId: 2,
      entryType: "ESCROW_HOLD" as const,
      amount: 5000,
    };
    const result = await reportDeposit(body);

    expect(api.post).toHaveBeenCalledWith("/v1/bank-transfers/deposit-reports", body);
    expect(result).toEqual(entry);
  });

  it("adminListLedgerEntries builds query string", async () => {
    const pageData = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 30,
    };
    vi.mocked(api.get).mockResolvedValue({ code: 200, message: "OK", data: pageData });

    await adminListLedgerEntries({
      page: 1,
      size: 30,
      status: "PENDING",
      entryType: "ESCROW_HOLD",
      userEmail: "buyer@test.com",
    });

    expect(api.get).toHaveBeenCalledWith(
      "/v1/admin/bank-transfers?page=1&size=30&status=PENDING&entryType=ESCROW_HOLD&userEmail=buyer%40test.com"
    );
  });

  it("adminDeleteSettlementAccount throws when code is not 200", async () => {
    vi.mocked(api.delete).mockResolvedValue({ code: 403, message: "forbidden", data: null });

    await expect(adminDeleteSettlementAccount(5)).rejects.toThrow("forbidden");
  });

  it("adminDeleteSettlementAccount resolves when code is 200", async () => {
    vi.mocked(api.delete).mockResolvedValue({ code: 200, message: "OK", data: null });

    await expect(adminDeleteSettlementAccount(5)).resolves.toBeUndefined();
  });
});
