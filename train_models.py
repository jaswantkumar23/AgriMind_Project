import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import pickle
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_dir, 'data', 'mirpurkhas_agri_data.csv')
if not os.path.exists(data_path):
    print(f"Error: {data_path} not found. Run generate_soil_data.py first.")
    exit(1)

df = pd.read_csv(data_path)

# Separate data into two situations
df_presowing = df[df['Situation'] == 'Pre-Sowing'].copy()
df_growth = df[df['Situation'] == 'Growth'].copy()

# ---------------------------------------------------------
# MODEL 1: Pre-Sowing Crop Recommendation
# ---------------------------------------------------------
print("Training Model 1: Pre-Sowing Crop Recommendation...")
features_m1 = ['District', 'Soil_Type', 'Previous_Crop', 'N', 'P', 'K', 'pH', 'Moisture']
X1 = df_presowing[features_m1]
y1 = df_presowing['Target_Action'] # Target is the crop name

# Encode categorical variables
le_dict_m1 = {}
for col in ['District', 'Soil_Type', 'Previous_Crop']:
    le = LabelEncoder()
    X1[col] = le.fit_transform(X1[col])
    le_dict_m1[col] = le

# Train-test split
X1_train, X1_test, y1_train, y1_test = train_test_split(X1, y1, test_size=0.2, random_state=42)

# Train model
rf1 = RandomForestClassifier(n_estimators=200, random_state=42)
rf1.fit(X1_train, y1_train)

# Evaluate
y1_pred = rf1.predict(X1_test)
acc1 = accuracy_score(y1_test, y1_pred)
print(f"Model 1 Accuracy: {acc1 * 100:.2f}%\n")

# ---------------------------------------------------------
# MODEL 2: Growth Phase Fertilizer Recommendation
# ---------------------------------------------------------
print("Training Model 2: Growth Phase Fertilizer Recommendation...")
features_m2 = ['Current_Crop', 'Stage', 'N', 'P', 'K', 'pH', 'Moisture']
X2 = df_growth[features_m2]
y2 = df_growth['Target_Action'] # Target is the fertilizer action

# Encode categorical variables
le_dict_m2 = {}
for col in ['Current_Crop', 'Stage']:
    le = LabelEncoder()
    X2[col] = le.fit_transform(X2[col])
    le_dict_m2[col] = le

# Train-test split
X2_train, X2_test, y2_train, y2_test = train_test_split(X2, y2, test_size=0.2, random_state=42)

# Train model
rf2 = RandomForestClassifier(n_estimators=200, random_state=42)
rf2.fit(X2_train, y2_train)

# Evaluate
y2_pred = rf2.predict(X2_test)
acc2 = accuracy_score(y2_test, y2_pred)
print(f"Model 2 Accuracy: {acc2 * 100:.2f}%\n")

# ---------------------------------------------------------
# SAVE MODELS AND ENCODERS
# ---------------------------------------------------------
models_dir = os.path.join(base_dir, 'models')
os.makedirs(models_dir, exist_ok=True)

model1_path = os.path.join(models_dir, 'model1_presowing.pkl')
with open(model1_path, 'wb') as f:
    pickle.dump({'model': rf1, 'encoders': le_dict_m1}, f)

model2_path = os.path.join(models_dir, 'model2_growth.pkl')
with open(model2_path, 'wb') as f:
    pickle.dump({'model': rf2, 'encoders': le_dict_m2}, f)

print(f"Models and Encoders successfully saved to {models_dir}")
