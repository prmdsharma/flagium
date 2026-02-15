from . import ocf_vs_pat, negative_fcf, revenue_debt_divergence, interest_coverage, profit_collapse

# Registry of all active flags
FLAG_REGISTRY = [
    ocf_vs_pat,
    negative_fcf,
    revenue_debt_divergence,
    interest_coverage,
    profit_collapse,
]

def get_all_flags():
    return FLAG_REGISTRY
