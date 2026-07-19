"""
AgriMind - District-Specific Agricultural Dataset Generator
============================================================
Districts: Mirpur Khas, Umerkot, Tharparkar
Purpose  : Generate a research-backed synthetic dataset with per-crop,
           per-district optimal soil conditions for Mirpurkhas Division, Sindh.

Each crop's NPK/pH/Moisture ranges are calibrated to:
  1. The specific soil type dominant in that district
  2. The agro-climatic zone of that district
  3. Published agronomic research for Sindh / semi-arid Pakistan

Output   : d:/AgriMind_Project/data/mirpurkhas_agri_data.csv
           ~30,000 rows | 12 columns
"""

import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

NUM_SAMPLES = 30000  # 10,000 per district

# ===========================================================================
# 1. DISTRICT PROFILES
#    Each district has a dominant soil type affecting baseline nutrient levels
# ===========================================================================
DISTRICT_PROFILES = {
    "Mirpur Khas": {
        "soil_types": ["Clay Loam", "Alluvial", "Silt Loam", "Loamy"],
        "description": "Fertile alluvial plains, canal-irrigated, high agricultural potential"
    },
    "Umerkot": {
        "soil_types": ["Sandy Loam", "Loamy", "Clay", "Light Sandy"],
        "description": "Semi-arid zone, mixed soils, partially canal-irrigated"
    },
    "Tharparkar": {
        "soil_types": ["Sandy", "Sandy Loam", "Desert Sand"],
        "description": "Arid desert zone, rain-fed farming, low organic matter soils"
    }
}

# ===========================================================================
# 2. DISTRICT-SPECIFIC CROP DATA
#    Each crop entry has OPTIMAL ranges for that specific district's soil.
#    Values are research-backed for Sindh agronomic conditions.
#
#    Format:
#      N   = Nitrogen   (mg/kg) - optimal soil level for that crop/district
#      P   = Phosphorus (mg/kg)
#      K   = Potassium  (mg/kg)
#      pH  = Soil pH
#      Mst = Soil Moisture (%)
# ===========================================================================
DISTRICT_CROPS = {

    # -------------------------------------------------------------------------
    # MIRPUR KHAS — Alluvial, fertile, canal-irrigated land
    # Major crops: Cotton, Wheat, Sugarcane, Mango, Banana, Chilli,
    #              Rice, Tomato, Onion, Guava
    # -------------------------------------------------------------------------
    "Mirpur Khas": {
        "Cotton": {
            "N": (120, 145), "P": (45, 58), "K": (175, 225),
            "pH": (6.8, 7.5), "Moisture": (45, 62),
            "note": "Primary cash crop; needs high K for boll development"
        },
        "Wheat": {
            "N": (100, 125), "P": (40, 52), "K": (115, 155),
            "pH": (6.5, 7.5), "Moisture": (40, 56),
            "note": "Rabi season; good alluvial soil supports high yield"
        },
        "Sugarcane": {
            "N": (175, 225), "P": (60, 82), "K": (195, 280),
            "pH": (6.5, 7.5), "Moisture": (65, 82),
            "note": "High water and nitrogen demand; canal irrigation essential"
        },
        "Mango": {
            "N": (110, 135), "P": (48, 65), "K": (155, 205),
            "pH": (5.8, 7.0), "Moisture": (35, 52),
            "note": "Mirpur Khas is famous for Sindhri mangoes; slightly acidic preferred"
        },
        "Banana": {
            "N": (165, 205), "P": (68, 92), "K": (215, 285),
            "pH": (6.0, 7.0), "Moisture": (70, 86),
            "note": "Very high K demand for bunch weight; constant moisture needed"
        },
        "Chilli": {
            "N": (98, 125), "P": (50, 67), "K": (128, 172),
            "pH": (6.0, 7.0), "Moisture": (48, 65),
            "note": "Kharif crop; phosphorus boosts fruit set and color"
        },
        "Rice": {
            "N": (118, 145), "P": (44, 62), "K": (108, 145),
            "pH": (5.5, 6.5), "Moisture": (80, 96),
            "note": "Lowland rice; flooded conditions, slightly acidic soil"
        },
        "Tomato": {
            "N": (108, 132), "P": (55, 72), "K": (158, 205),
            "pH": (6.0, 7.0), "Moisture": (55, 70),
            "note": "Both Kharif and Rabi; high P and K for fruit quality"
        },
        "Onion": {
            "N": (108, 132), "P": (50, 66), "K": (158, 202),
            "pH": (6.2, 7.0), "Moisture": (50, 65),
            "note": "Rabi season; sulphur-rich soils improve pungency"
        },
        "Guava": {
            "N": (88, 112), "P": (38, 56), "K": (118, 162),
            "pH": (5.5, 7.0), "Moisture": (38, 55),
            "note": "Hardy fruit; moderate nutrition, well-drained alluvial soil"
        }
    },

    # -------------------------------------------------------------------------
    # UMERKOT — Sandy loam, semi-arid, partially canal-irrigated
    # Major crops: Cotton, Wheat, Bajra, Guar, Moth bean,
    #              Onion, Chilli, Sunflower, Jowar
    # -------------------------------------------------------------------------
    "Umerkot": {
        "Cotton": {
            "N": (108, 132), "P": (38, 52), "K": (155, 205),
            "pH": (7.0, 7.8), "Moisture": (38, 55),
            "note": "Slightly alkaline sandy loam; lower N than Mirpur Khas"
        },
        "Wheat": {
            "N": (88, 112), "P": (32, 46), "K": (98, 132),
            "pH": (6.8, 7.6), "Moisture": (35, 50),
            "note": "Semi-arid rabi; less moisture available than MK district"
        },
        "Bajra": {
            "N": (78, 102), "P": (28, 44), "K": (78, 122),
            "pH": (6.5, 8.0), "Moisture": (20, 42),
            "note": "Pearl millet; drought-tolerant, thrives in sandy loam"
        },
        "Guar": {
            "N": (22, 40), "P": (44, 62), "K": (48, 72),
            "pH": (7.0, 8.5), "Moisture": (18, 36),
            "note": "Nitrogen-fixing legume; phosphorus critical for nodulation"
        },
        "Moth bean": {
            "N": (18, 35), "P": (32, 50), "K": (38, 62),
            "pH": (7.0, 8.2), "Moisture": (15, 32),
            "note": "Highly drought-tolerant; very low water requirement"
        },
        "Onion": {
            "N": (98, 122), "P": (44, 62), "K": (148, 182),
            "pH": (6.5, 7.2), "Moisture": (48, 64),
            "note": "Needs irrigation; produces smaller but pungent bulbs"
        },
        "Chilli": {
            "N": (88, 112), "P": (44, 62), "K": (118, 158),
            "pH": (6.5, 7.5), "Moisture": (44, 60),
            "note": "Important vegetable crop; hot dry climate improves capsaicin"
        },
        "Sunflower": {
            "N": (82, 112), "P": (38, 55), "K": (108, 152),
            "pH": (6.5, 7.5), "Moisture": (38, 55),
            "note": "Oil crop; tolerates mild salinity in sandy loam"
        },
        "Jowar": {
            "N": (78, 108), "P": (28, 44), "K": (58, 92),
            "pH": (6.5, 8.0), "Moisture": (22, 45),
            "note": "Sorghum; dual-purpose (grain + fodder), low water demand"
        }
    },

    # -------------------------------------------------------------------------
    # THARPARKAR — Sandy/desert soils, rain-fed, arid zone
    # Major crops: Bajra, Guar, Moth bean, Jowar, Dates,
    #              Desert grasses, Wheat (limited)
    # -------------------------------------------------------------------------
    "Tharparkar": {
        "Bajra": {
            "N": (55, 80), "P": (18, 35), "K": (48, 82),
            "pH": (7.5, 8.5), "Moisture": (10, 28),
            "note": "Primary food crop of Thar desert; minimal inputs, rain-fed"
        },
        "Guar": {
            "N": (12, 28), "P": (28, 45), "K": (32, 55),
            "pH": (7.5, 9.0), "Moisture": (10, 22),
            "note": "Thrives in alkaline desert sand; nitrogen-fixing roots"
        },
        "Moth bean": {
            "N": (12, 28), "P": (22, 38), "K": (28, 50),
            "pH": (7.5, 8.8), "Moisture": (8, 22),
            "note": "Most drought-tolerant legume; survives on very little rain"
        },
        "Jowar": {
            "N": (52, 78), "P": (18, 35), "K": (38, 68),
            "pH": (7.0, 8.5), "Moisture": (10, 28),
            "note": "Important fodder and grain in Thar; heat-tolerant"
        },
        "Dates": {
            "N": (88, 122), "P": (52, 75), "K": (98, 145),
            "pH": (7.5, 8.5), "Moisture": (8, 22),
            "note": "Grown in irrigated pockets of Tharparkar; high K for fruit"
        },
        "Desert grasses": {
            "N": (8, 22), "P": (8, 20), "K": (18, 35),
            "pH": (7.5, 9.2), "Moisture": (4, 16),
            "note": "Natural vegetation / fodder; survives extreme arid conditions"
        },
        "Wheat": {
            "N": (68, 92), "P": (22, 40), "K": (78, 112),
            "pH": (7.0, 8.2), "Moisture": (28, 45),
            "note": "Limited cultivation in irrigated pockets; lower yield than MK"
        }
    }
}

# Crop growth stages
GROWTH_STAGES = ["Seedling", "Vegetative", "Flowering", "Maturity"]

# ===========================================================================
# 3. HELPER: Determine fertilizer action for Growth phase
# ===========================================================================
def get_fertilizer_action(crop, district, N, P, K, pH):
    """
    Compare current NPK with optimal ranges for this crop+district.
    Return a human-readable fertilizer recommendation.
    """
    crop_data = DISTRICT_CROPS[district][crop]
    actions = []

    N_min, N_max = crop_data["N"]
    P_min, P_max = crop_data["P"]
    K_min, K_max = crop_data["K"]
    pH_min, pH_max = crop_data["pH"]

    if N < N_min * 0.75:
        actions.append("Add Nitrogen - Urea (High Deficiency)")
    elif N < N_min:
        actions.append("Add Nitrogen - Urea (Mild Deficiency)")

    if P < P_min * 0.75:
        actions.append("Add Phosphorus - DAP (High Deficiency)")
    elif P < P_min:
        actions.append("Add Phosphorus - DAP (Mild Deficiency)")

    if K < K_min * 0.75:
        actions.append("Add Potassium - SOP/MOP (High Deficiency)")
    elif K < K_min:
        actions.append("Add Potassium - SOP/MOP (Mild Deficiency)")

    if pH > pH_max + 0.5:
        actions.append("Apply Gypsum - Reduce Soil Alkalinity")
    elif pH < pH_min - 0.5:
        actions.append("Apply Lime - Increase Soil pH")

    return " + ".join(actions) if actions else "Nutrients Optimal - No Action Needed"

# ===========================================================================
# 4. HELPER: Find best crop for Pre-Sowing based on current soil
# ===========================================================================
def find_best_crop(district, N, P, K, pH, moisture):
    """
    Compare current soil values against each crop's optimal range in this district.
    Find the crop with the lowest weighted deviation from its ideal midpoint.
    """
    best_crop = None
    min_score = float("inf")

    for crop, req in DISTRICT_CROPS[district].items():
        N_mid = (req["N"][0] + req["N"][1]) / 2
        P_mid = (req["P"][0] + req["P"][1]) / 2
        K_mid = (req["K"][0] + req["K"][1]) / 2
        pH_mid = (req["pH"][0] + req["pH"][1]) / 2
        M_mid = (req["Moisture"][0] + req["Moisture"][1]) / 2

        # Weighted score: pH and Moisture have higher weight (more critical)
        score = (
            abs(N - N_mid) * 0.20 +
            abs(P - P_mid) * 0.20 +
            abs(K - K_mid) * 0.15 +
            abs(pH - pH_mid) * 25.0 +    # high weight — pH mismatch is critical
            abs(moisture - M_mid) * 0.25
        )
        if score < min_score:
            min_score = score
            best_crop = crop

    return best_crop

# ===========================================================================
# 5. GENERATE DATASET
# ===========================================================================
print("=" * 60)
print("AgriMind — District-Specific Dataset Generator")
print("Districts: Mirpur Khas | Umerkot | Tharparkar")
print("=" * 60)

data_rows = []
districts = list(DISTRICT_PROFILES.keys())
samples_per_district = NUM_SAMPLES // len(districts)  # 10,000 each

for district in districts:
    crops_in_district = list(DISTRICT_CROPS[district].keys())
    soil_types = DISTRICT_PROFILES[district]["soil_types"]
    samples_per_crop = samples_per_district // len(crops_in_district)

    print(f"\n  Generating data for {district} ({len(crops_in_district)} crops)...")

    crop_count = 0
    for crop in crops_in_district:
        req = DISTRICT_CROPS[district][crop]
        soil_type = random.choice(soil_types)

        # Generate slightly more samples for last crop to hit target count
        n_crop_samples = samples_per_crop
        if crop == crops_in_district[-1]:
            n_crop_samples = samples_per_district - (samples_per_crop * (len(crops_in_district) - 1))

        for _ in range(n_crop_samples):
            soil_type = random.choice(soil_types)

            # --- Generate OPTIMAL soil values (centered around ideal midpoint) ---
            N_opt   = (req["N"][0] + req["N"][1]) / 2
            P_opt   = (req["P"][0] + req["P"][1]) / 2
            K_opt   = (req["K"][0] + req["K"][1]) / 2
            pH_opt  = (req["pH"][0] + req["pH"][1]) / 2
            M_opt   = (req["Moisture"][0] + req["Moisture"][1]) / 2

            # Add realistic variance (some samples will be deficient, some optimal)
            # ~40% samples optimal, ~40% slightly deficient, ~20% severely deficient
            rand_type = random.choices(
                ["optimal", "mild_def", "severe_def"],
                weights=[0.40, 0.40, 0.20]
            )[0]

            if rand_type == "optimal":
                N_range = req["N"]; P_range = req["P"]; K_range = req["K"]
                N = round(random.uniform(N_range[0], N_range[1]), 1)
                P = round(random.uniform(P_range[0], P_range[1]), 1)
                K = round(random.uniform(K_range[0], K_range[1]), 1)
                pH = round(random.uniform(req["pH"][0], req["pH"][1]), 2)
                moisture = round(random.uniform(req["Moisture"][0], req["Moisture"][1]), 1)

            elif rand_type == "mild_def":
                N = round(random.uniform(req["N"][0] * 0.65, req["N"][0] * 0.95), 1)
                P = round(random.uniform(req["P"][0] * 0.65, req["P"][0] * 0.95), 1)
                K = round(random.uniform(req["K"][0] * 0.70, req["K"][0] * 0.95), 1)
                pH = round(random.uniform(req["pH"][0], req["pH"][1] + 0.4), 2)
                moisture = round(random.uniform(req["Moisture"][0] * 0.7, req["Moisture"][0]), 1)

            else:  # severe_def
                N = round(random.uniform(req["N"][0] * 0.30, req["N"][0] * 0.65), 1)
                P = round(random.uniform(req["P"][0] * 0.30, req["P"][0] * 0.65), 1)
                K = round(random.uniform(req["K"][0] * 0.30, req["K"][0] * 0.70), 1)
                pH = round(random.uniform(req["pH"][1], req["pH"][1] + 0.8), 2)
                moisture = round(random.uniform(max(2, req["Moisture"][0] * 0.3), req["Moisture"][0] * 0.65), 1)

            # Clamp values to realistic bounds
            N        = round(max(5.0,  min(N, 320.0)), 1)
            P        = round(max(3.0,  min(P, 160.0)), 1)
            K        = round(max(15.0, min(K, 420.0)), 1)
            pH       = round(max(4.5,  min(pH, 9.5)), 2)
            moisture = round(max(2.0,  min(moisture, 100.0)), 1)

            # Decide situation: 50% Pre-Sowing, 50% Growth
            situation = random.choice(["Pre-Sowing", "Growth"])

            if situation == "Pre-Sowing":
                previous_crop = random.choice(crops_in_district)
                current_crop  = "None"
                stage         = "Empty Field"
                # Target: which crop should the farmer plant?
                target_action = find_best_crop(district, N, P, K, pH, moisture)

            else:  # Growth phase
                previous_crop = "None"
                current_crop  = crop
                stage         = random.choice(GROWTH_STAGES)
                # Target: what fertilizer action is needed?
                target_action = get_fertilizer_action(crop, district, N, P, K, pH)

            data_rows.append([
                district, soil_type, previous_crop, current_crop,
                stage, N, P, K, pH, moisture, target_action, situation
            ])

        crop_count += 1

    print(f"    [OK] {district}: {samples_per_district} samples across {len(crops_in_district)} crops")

# ===========================================================================
# 6. SAVE CSV
# ===========================================================================
columns = [
    "District", "Soil_Type", "Previous_Crop", "Current_Crop",
    "Stage", "N", "P", "K", "pH", "Moisture", "Target_Action", "Situation"
]

df = pd.DataFrame(data_rows, columns=columns)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # Shuffle rows

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
os.makedirs(data_dir, exist_ok=True)
output_path = os.path.join(data_dir, "mirpurkhas_agri_data.csv")
df.to_csv(output_path, index=False)

print("\n" + "=" * 60)
print(f"[DONE] Dataset saved: {output_path}")
print(f"   Total rows   : {len(df):,}")
print(f"   Columns      : {', '.join(columns)}")
print("\n   District breakdown:")
print(df["District"].value_counts().to_string())
print("\n   Situation split:")
print(df["Situation"].value_counts().to_string())
print("\n   Pre-Sowing targets (crop recommendations):")
presow = df[df["Situation"] == "Pre-Sowing"]["Target_Action"].value_counts()
print(presow.head(10).to_string())
print("\n   Growth targets (fertilizer actions):")
growth = df[df["Situation"] == "Growth"]["Target_Action"].value_counts()
print(growth.head(10).to_string())
print("=" * 60)
