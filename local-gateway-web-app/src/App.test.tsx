import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { server } from "./mocks/server";
import { mockBid } from "./mocks/handlers";
import { fetchData } from "./App";
import { MemoryRouter } from "react-router-dom";
import BidsMenu from "./BidsPage";

beforeAll(() => server.listen());

afterAll(() => server.close());

// test("Renders Org Asset Data Properly From Mock Data", async () => {
//   render(<App />);
//   const AssetName = await waitFor(() => screen.queryAllByText(/Virtual_IoT_Device_1070/i));
//   const AssetCID = await waitFor(() =>
//     screen.queryAllByText("QmQC73RJZiSaBxS9WgHF3t2gpG17BuZL9oKuBEHnvzkCy3")
//   );
//   expect(AssetName && AssetCID).toBeTruthy();
// });

describe("Should render all the titles for all data fields when app is started", () => {
  it("Renders the main app title", async () => {
    render(<App />);

    await waitFor(
      () => {
        const mainTitle = screen.getByText("Community Data Viewer");
        expect(mainTitle).toBeInTheDocument();

        const otherOrgsTitle = screen.getByText("Other Orgs Assets");
        expect(otherOrgsTitle).toBeInTheDocument();

        const myOrgsTitle = screen.getByText("My Orgs Assets");
        expect(myOrgsTitle).toBeInTheDocument();

        const viewAssetTitle = screen.getByText("View Asset Data");
        expect(viewAssetTitle).toBeInTheDocument();

        const myOrgName = screen.getByText("testOrg");
        expect(myOrgName).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });
});

describe("Should display mock dataFields with the correct mock values", () => {
  it("Renders Other Orgs Assets field with mock values correctly", async () => {
    render(<App />);
    await waitFor(() => {
      const assetNameText = screen.getByText("Virtual_IoT_Device_8709");
      expect(assetNameText).toBeInTheDocument();
      const IPFS_CIDText = screen.getByText("QmQ2EkvXGFHxCW9G8QFSX3bGzwp9DoTJmKjX6ACcQJdhuP");
      expect(IPFS_CIDText).toBeInTheDocument();
      const ownerOrgText = screen.getByText("Org1MSP");
      expect(ownerOrgText).toBeInTheDocument();
    });
  });

  it("Renders My Orgs Assets field with mock values correctly", async () => {
    render(<App />);
    await waitFor(() => {
      const assetNameText = screen.getByText("Virtual_IoT_Device_7941");
      expect(assetNameText).toBeInTheDocument();
      const IPFS_CIDText = screen.getByText("QmTRW4y257tueE95yxwEaMML4fhvE6zbY3UqvvXqx6ETg4");
      expect(IPFS_CIDText).toBeInTheDocument();
      const ownerOrgText = screen.getByText("testOrg");
      expect(ownerOrgText).toBeInTheDocument();
    });
  });

  it("shows bid", async () => {
    render(<BidsMenu bidsForMyOrg={mockBid} />);
    const bidsText = screen.getAllByText("Bids");
    expect(bidsText).toBeTruthy;

    const additionalCommitmentsText = screen.getByText("testCommitments");
    const biddingOrgText = screen.getByText("Org1MSP");
    const currentOwnerOrgText = screen.getByText("testOrg");
    const deviceNameText = screen.getByText("Virtual_IoT_Device_1337");
    const dateText = screen.getByText("2023-08-08");
    const priceText = screen.getByText("42");

    expect(additionalCommitmentsText).toBeInTheDocument();
    expect(biddingOrgText).toBeInTheDocument();
    expect(currentOwnerOrgText).toBeInTheDocument();
    expect(deviceNameText).toBeInTheDocument();
    expect(dateText).toBeInTheDocument();
    expect(priceText).toBeInTheDocument();
  });
});

describe("Function fetchData works as expected", () => {
  it("fetches data and calls the setter function with the result", async () => {
    // Mock the fetch function and its response
    const mockResponse = {
      ok: true,
      json: async () => ({ data: "mocked-data" }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    // Set up a mock setter function
    const mockSetter = jest.fn();

    // Call the fetchData function with the mock endpoint and setter
    await fetchData("/mock-endpoint", mockSetter);

    // Assertions
    expect(fetch).toHaveBeenCalledWith("/mock-endpoint");
    expect(mockSetter).toHaveBeenCalledWith({ data: "mocked-data" });
  });

  it("logs an error if the API call is not successful", async () => {
    // Mock a failed response
    const mockResponse = {
      ok: false,
      statusText: "Not Found",
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    // Set up a mock setter function
    const mockSetter = jest.fn();

    // Call fetchData
    try {
      await fetchData("/mock-endpoint", mockSetter);
    } catch (error: any) {
      // Check if the error message matches the expected message
      expect(error.message).toBe("Unable to fetch data");
    }

    expect(mockSetter).toHaveBeenCalledTimes(0);
  });
});
