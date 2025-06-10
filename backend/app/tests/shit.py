import random


def black_flash(
    current_vote_point: float,
    impact: float = 1e-6,
    impact_multiplier: float = 1000.0,
    beta_beta: float = 1.0,
    rng: random.Random = random.Random(),
) -> bool:
    """
    Determine whether a “Black Flash” activates, using Beta distribution.

    Args:
        current_vote_point: float > 0. Influences the Beta(alpha, beta_beta) alpha parameter.
        impact: base small factor for threshold calculation.
        impact_multiplier: multiplier applied to impact to compute threshold offset.
        beta_beta: the beta parameter for the Beta distribution (> 0).
        rng: random generator with betavariate method (default: random module).
    Returns:
        True if activation occurs; otherwise False.
    """
    if current_vote_point <= 0:
        return False
    # Compute threshold; e.g., 1 - impact * impact_multiplier
    threshold = 1.0 - impact * impact_multiplier
    # Sample from Beta
    flash_chance = rng.betavariate(current_vote_point, beta_beta)
    return flash_chance >= threshold


def estimate_rate(vp, trials=100_000):
    count = 0
    for _ in range(trials):
        if black_flash(vp):
            count += 1
    return count


for vp in [0.2, 1]:
    print(vp, estimate_rate(vp))
