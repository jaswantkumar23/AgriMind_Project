import sys
import json
import pickle
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

def main():
    try:
        # Read JSON from standard input
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        situation = data.get('situation', 'Pre-Sowing') # 'Pre-Sowing' or 'Growth'
        
        if situation == 'Pre-Sowing':
            with open('d:/AgriMind_Project/models/model1_presowing.pkl', 'rb') as f:
                model_data = pickle.load(f)
                model = model_data['model']
                encoders = model_data['encoders']
                
            # Default missing values for safety
            df = pd.DataFrame([{
                'District': data.get('District', 'Mirpur Khas'),
                'Soil_Type': data.get('Soil_Type', 'Loamy'),
                'Previous_Crop': data.get('Previous_Crop', 'None'),
                'N': float(data.get('N', 50)),
                'P': float(data.get('P', 20)),
                'K': float(data.get('K', 200)),
                'pH': float(data.get('pH', 8.0)),
                'Moisture': float(data.get('Moisture', 40))
            }])
            
            # Encode
            for col in ['District', 'Soil_Type', 'Previous_Crop']:
                if df[col][0] in encoders[col].classes_:
                    df[col] = encoders[col].transform(df[col])
                else:
                    # Fallback to the first class if unknown
                    df[col] = encoders[col].transform([encoders[col].classes_[0]])
                    
            pred_probs = model.predict_proba(df)[0]
            classes = model.classes_
            
            # Combine classes and probabilities
            class_probs = list(zip(classes, pred_probs))
            # Sort by probability descending
            class_probs.sort(key=lambda x: x[1], reverse=True)
            
            # Top 1 prediction
            pred = class_probs[0][0]
            
            # Next 3 alternatives
            alternatives = [c[0] for c in class_probs[1:4]]
            
            result = {"prediction": pred, "alternatives": alternatives, "type": "crop_recommendation"}
            
        else: # Growth Phase
            with open('d:/AgriMind_Project/models/model2_growth.pkl', 'rb') as f:
                model_data = pickle.load(f)
                model = model_data['model']
                encoders = model_data['encoders']
                
            df = pd.DataFrame([{
                'Current_Crop': data.get('Current_Crop', 'Cotton'),
                'Stage': data.get('Stage', 'Vegetative'),
                'N': float(data.get('N', 40)),
                'P': float(data.get('P', 15)),
                'K': float(data.get('K', 200)),
                'pH': float(data.get('pH', 8.0)),
                'Moisture': float(data.get('Moisture', 40))
            }])
            
            # Encode
            for col in ['Current_Crop', 'Stage']:
                if df[col][0] in encoders[col].classes_:
                    df[col] = encoders[col].transform(df[col])
                else:
                    df[col] = encoders[col].transform([encoders[col].classes_[0]])
                    
            pred = model.predict(df)[0]
            result = {"prediction": pred, "type": "fertilizer_action"}
            
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
