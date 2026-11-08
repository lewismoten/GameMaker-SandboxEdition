"""Numeric USD costs from the BOM's dated listing evidence; unknown prices stay blank.

OpenAI Codex (GPT-6), directed by Lewis Moten. No live retailer quote is implied.
"""
from decimal import Decimal

# These are the read prices already recorded by bom.py on 2026-11-03.
PRICES = {
    "U1": ("Futurlec", "2.20"), "U2": ("Futurlec MT8870DE", "1.45"),
    "U4": ("Futurlec", "0.22"), "U5": ("Futurlec LM386N-3", "0.55"),
    "U6": ("Digi-Key", "0.65"), "Q": ("Futurlec", "0.06"),
    "X1": ("Futurlec", "0.30"), "D1": ("Futurlec", "0.25"),
    "D2": ("Futurlec", "0.16"), "DS": ("Futurlec", "1.20"),
    "MK1": ("Futurlec", "0.45"), "SW": ("Futurlec", "0.25"),
}


def cost_fields(row):
    ref = row["Refs"].split(",")[0]
    family = ref.rstrip("0123456789")
    price = PRICES.get(ref, PRICES.get(family))
    if family == "R":
        # Ten for $0.10: this is consumed-part cost, not the minimum order cost.
        price = ("Futurlec (10-pack allocation)", "0.01")
    if family == "C":
        price = {"100nF": ("Futurlec C100UC", "0.10"),
                 "10uF": ("Futurlec C010U16E", "0.05"),
                 "100uF": ("Futurlec C100U25E", "0.08")}.get(row["Value"])
    supplier, unit = price or ("", "")
    return dict(Supplier=supplier, Currency="USD", Unit_cost=unit,
                Extended_cost=f"{Decimal(unit) * row['Qty']:.2f}" if unit else "",
                Price_status="2026-11-03 recorded price; confirm listing and stock before ordering" if unit else "UNKNOWN: chosen part price or stock needs confirmation")


def cost_totals(rows):
    subtotal = sum((Decimal(r["Extended_cost"]) for r in rows if r["Extended_cost"]), Decimal(0))
    missing = sum(not r["Unit_cost"] for r in rows)
    def total_row(label, amount, status):
        row = dict.fromkeys(rows[0], "")
        row.update(Refs=label, Currency="USD", Extended_cost=amount, Price_status=status)
        return row
    return [total_row("KNOWN SUBTOTAL", f"{subtotal:.2f}", "Consumed parts only; excludes shipping, tax, sockets, board, batteries and shell"),
            total_row("TOTAL", "" if missing else f"{subtotal:.2f}", f"UNKNOWN: {missing} unpriced lines" if missing else "All listed lines priced")]
