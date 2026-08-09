import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlaceField } from "./place-field";
import * as placeResource from "@/services/resources/place";

const samplePlace = {
  name: "Le Duplex",
  address: "42 rue de la République, 69002 Lyon, France",
  lat: 45.764,
  lng: 4.8357,
};

describe("PlaceField", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state, then search results, and selecting one calls onChange", async () => {
    let resolveSearch: (places: (typeof samplePlace)[]) => void = () => {};
    vi.spyOn(placeResource, "searchPlaces").mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );

    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlaceField value={null} onChange={onChange} />);

    await user.type(screen.getByRole("combobox"), "Le Duplex");

    expect(await screen.findByText("Searching…", {}, { timeout: 2000 })).toBeInTheDocument();

    resolveSearch([samplePlace]);

    const option = await screen.findByRole("option", { name: /Le Duplex/ });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith(samplePlace);
  });

  it("shows the selected place's name as the input value", () => {
    render(<PlaceField value={samplePlace} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("Le Duplex");
  });

  it("clears the selected place when the clear button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlaceField value={samplePlace} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Clear place" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
