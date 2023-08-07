import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { server } from "./mocks/server";

beforeAll(() => server.listen());

afterAll(() => server.close());

test("Renders title", () => {
  render(<App />);
  const linkElement = screen.getByText(/Community Data Viewer/i);
  expect(linkElement).toBeInTheDocument();
});

test("Renders All Orgs Assets", () => {
  render(<App />);
  const linkElement = screen.getByText(/Other Orgs Assets/i);
  expect(linkElement).toBeInTheDocument();
});

test("Renders My Orgs Assets", () => {
  render(<App />);
  const linkElement = screen.getByText(/My Orgs Assets/i);
  expect(linkElement).toBeInTheDocument();
});

test("Renders View Asset Data", () => {
  render(<App />);
  const linkElement = screen.getByText(/View Asset Data/i);
  expect(linkElement).toBeInTheDocument();
});

test("Renders Org Asset Data Properly From Mock Data", async () => {
  render(<App />);
  const AssetName = await waitFor(() => screen.queryAllByText(/Virtual_IoT_Device_1070/i));
  const AssetCID = await waitFor(() =>
    screen.queryAllByText("QmQC73RJZiSaBxS9WgHF3t2gpG17BuZL9oKuBEHnvzkCy3")
  );
  expect(AssetName && AssetCID).toBeTruthy();
});
