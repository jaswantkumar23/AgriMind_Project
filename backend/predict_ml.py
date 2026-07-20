import os
import sys
import json
import pickle
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

def get_models_dir():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    models_in_parent = os.path.join(parent_dir, 'models')
    if os.path.exists(models_in_parent):
        return models_in_parent
    return os.path.join(current_dir, 'models')

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "Empty input data"}))
            return
        data = json.loads(input_data)
        
        situation = data.get('situation', 'Pre-Sowing')
        models_dir = get_models_dir()
        
        if situation == 'Pre-Sowing':
            m1_path = os.path.join(models_dir, 'model1_presowing.pkl')
            with open(m1_path, 'rb') as f:
                model_data = pickle.load(f)
                model = model_data['model']
                encoders = model_data['encoders']
                
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
            
            for col in ['District', 'Soil_Type', 'Previous_Crop']:
                if df[col][0] in encoders[col].classes_:
                    df[col] = encoders[col].transform(df[col])
                else:
                    df[col] = encoders[col].transform([encoders[col].classes_[0]])
                    
            pred_probs = model.predict_proba(df)[0]
            classes = model.classes_
            
            class_probs = list(zip(classes, pred_probs))
            class_probs.sort(key=lambda x: x[1], reverse=True)
            
            pred = class_probs[0][0]
            confidence = round(float(class_probs[0][1]) * 100, 1)
            alternatives = [c[0] for c in class_probs[1:4]]
            
            result = {
                "prediction": pred,
                "confidence": confidence,
                "alternatives": alternatives,
                "type": "crop_recommendation"
            }
            
        else: # Growth Phase
            m2_path = os.path.join(models_dir, 'model2_growth.pkl')
            with open(m2_path, 'rb') as f:
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
            
            for col in ['Current_Crop', 'Stage']:
                if df[col][0] in encoders[col].classes_:
                    df[col] = encoders[col].transform(df[col])
                else:
                    df[col] = encoders[col].transform([encoders[col].classes_[0]])
                    
            pred_probs = model.predict_proba(df)[0]
            pred = model.predict(df)[0]
            max_prob_idx = list(model.classes_).index(pred) if pred in model.classes_ else 0
            confidence = round(float(pred_probs[max_prob_idx]) * 100, 1)
            
            result = {
                "prediction": pred,
                "confidence": confidence,
                "type": "fertilizer_action"
            }
            
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
