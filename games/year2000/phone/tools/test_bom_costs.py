"""Cost regressions: quantities, unpriced parts, and a total that cannot hide unknowns."""
import unittest
from bom_costs import cost_fields, cost_totals


class CostsTest(unittest.TestCase):
    def row(self, ref, qty, value):
        row = dict(Refs=ref, Qty=qty, Value=value)
        return dict(row, **cost_fields(row))

    def test_quantities_and_resistor_pack_allocation(self):
        self.assertEqual(self.row("DS1,DS2", 2, "display")["Extended_cost"], "2.40")
        self.assertEqual(self.row("R1,R6", 2, "10k")["Extended_cost"], "0.02")

    def test_unknowns_are_not_zero(self):
        for ref, value in [("RV1", "100k thumbwheel"), ("C3", "1uF"), ("U3", "MAX7219N")]:
            self.assertEqual(self.row(ref, 1, value)["Unit_cost"], "")
        totals = cost_totals([self.row("U1", 1, "PIC"), self.row("RV1", 1, "pot")])
        self.assertEqual(totals[0]["Extended_cost"], "2.20")
        self.assertEqual(totals[1]["Extended_cost"], "")
        self.assertIn("1 unpriced", totals[1]["Price_status"])


if __name__ == "__main__":
    unittest.main()
