import { render, screen } from "@/lib/test-utils";
import { describe, expect, it } from "vitest";

import { EntityDetailLayout } from "./entity-detail-layout";

const noop = <div />;

describe("EntityDetailLayout", () => {
  it("renders the title and icon slot", () => {
    render(
      <EntityDetailLayout
        icon={<span data-testid="icon" />}
        title="Empty Road"
        sidebarItems={[]}
        attachments={noop}
      />,
    );

    expect(screen.getByRole("heading", { name: "Empty Road" })).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders each sidebar item's label and value on the desktop panel", () => {
    render(
      <EntityDetailLayout
        title="Empty Road"
        sidebarItems={[{ label: "Artist", value: "The Wayfinders" }]}
        attachments={noop}
      />,
    );

    expect(screen.getByText("Artist")).toBeInTheDocument();
    expect(screen.getAllByText("The Wayfinders").length).toBeGreaterThan(0);
  });

  it("renders the actions slot", () => {
    render(
      <EntityDetailLayout
        title="Empty Road"
        actions={<button type="button">Share</button>}
        sidebarItems={[]}
        attachments={noop}
      />,
    );

    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("renders children between the mobile badge row and the attachments slot", () => {
    render(
      <EntityDetailLayout
        title="Empty Road"
        sidebarItems={[]}
        attachments={<div data-testid="attachments-slot" />}
      >
        <div data-testid="children-slot" />
      </EntityDetailLayout>,
    );

    expect(screen.getByTestId("children-slot")).toBeInTheDocument();
    expect(screen.getByTestId("attachments-slot")).toBeInTheDocument();
  });
});
