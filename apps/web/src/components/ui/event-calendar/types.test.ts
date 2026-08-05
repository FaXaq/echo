import { describe, expect, it } from "vitest"

import { calendarViewSchema } from "./types"

describe("calendarViewSchema", () => {
  it("accepts the four calendar views", () => {
    expect(calendarViewSchema.options).toEqual([
      "month",
      "week",
      "day",
      "agenda",
    ])
  })

  it("rejects an unrecognized view", () => {
    const result = calendarViewSchema.safeParse("bogus")
    expect(result.success).toBe(false)
  })
})
