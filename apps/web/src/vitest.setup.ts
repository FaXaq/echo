import "@testing-library/jest-dom/vitest";
import { i18n } from "@lingui/core";
import { catalogs } from "@echo/i18n";

i18n.load(catalogs);
i18n.activate("en");

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}
if (typeof ResizeObserver === "undefined") {
  class ResizeObserverStub implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserverStub;
}
