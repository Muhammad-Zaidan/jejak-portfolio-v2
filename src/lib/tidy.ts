/**
 * Compares the order a visitor gave the steps with the owner's order (0, 1, 2, …).
 * `order[slot]` is the step index the visitor put in that slot.
 */
export function compareOrder(order: number[]) {
  return {
    first: order[0],
    sameStart: order[0] === 0,
    matches: order.filter((step, slot) => step === slot).length,
  }
}
