"""
Weather-based Disease Prediction Model
Wraps existing .pkl models and provides rule-based prediction for all crops.
Predicts whether a plant COULD get a disease based on environmental conditions.
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, Optional


# Disease databases for each crop
DISEASE_INFO = {
    "potato": {
        0: {"name": "Healthy", "treatment": "No action needed. Conditions are optimal.", "risk": "LOW"},
        1: {"name": "Late Blight", "treatment": "Spray Mancozeb (2.5g/L). Ensure proper drainage. Avoid overhead irrigation.", "risk": "HIGH"},
        2: {"name": "Early Blight", "treatment": "Spray Copper Oxychloride. Remove infected leaves. Practice crop rotation.", "risk": "HIGH"},
        3: {"name": "Black Scurf", "treatment": "Treat seeds with Boric Acid (3%). Use disease-free tubers.", "risk": "MEDIUM"},
        4: {"name": "Common Scab", "treatment": "Irrigate field to maintain soil moisture. Lower soil pH to 5.0-5.2.", "risk": "MEDIUM"},
        5: {"name": "Soft Rot", "treatment": "Remove rotting plants immediately. Improve field drainage.", "risk": "HIGH"},
    },
    "rice": {
        0: {"name": "Healthy", "treatment": "No action needed. Conditions are optimal.", "risk": "LOW"},
        1: {"name": "Rice Blast", "treatment": "Apply Tricyclazole 75 WP (0.6g/L). Avoid excess nitrogen fertilizer.", "risk": "HIGH"},
        2: {"name": "Brown Spot", "treatment": "Spray Propiconazole (1ml/L). Apply balanced fertilizers.", "risk": "MEDIUM"},
        3: {"name": "False Smut", "treatment": "Spray Copper Hydroxide at boot stage. Avoid late nitrogen application.", "risk": "MEDIUM"},
        4: {"name": "Bacterial Blight", "treatment": "Drain field. Apply Streptocycline (3g in 10L water).", "risk": "HIGH"},
        5: {"name": "Tungro Virus", "treatment": "Control Leafhoppers using Imidacloprid. Use resistant varieties.", "risk": "HIGH"},
    },
    "tea": {
        0: {"name": "Healthy", "treatment": "No action needed. Conditions are optimal.", "risk": "LOW"},
        1: {"name": "Blister Blight", "treatment": "Spray Copper Oxychloride (0.25%). Prune affected bushes. Ensure air circulation.", "risk": "HIGH"},
        2: {"name": "Grey Blight", "treatment": "Apply Mancozeb spray. Remove affected leaves. Reduce shade.", "risk": "MEDIUM"},
        3: {"name": "Red Rust", "treatment": "Spray Bordeaux mixture. Improve drainage. Reduce humidity.", "risk": "MEDIUM"},
        4: {"name": "Anthracnose", "treatment": "Apply Copper-based fungicides. Prune dead branches. Avoid water stress.", "risk": "HIGH"},
    },
    "makhana": {
        0: {"name": "Healthy", "treatment": "No action needed. Conditions are optimal.", "risk": "LOW"},
        1: {"name": "Leaf Blight", "treatment": "Spray Neem Oil (5ml/L). Ensure proper water circulation.", "risk": "HIGH"},
        2: {"name": "Root Rot", "treatment": "Maintain water depth 0.5-1.5m. Improve water quality.", "risk": "HIGH"},
        3: {"name": "Aphid Damage", "treatment": "Apply Imidacloprid (0.3ml/L). Introduce natural predators.", "risk": "MEDIUM"},
        4: {"name": "Algal Infection", "treatment": "Apply Copper Sulphate (1g per 1000L water). Reduce organic matter.", "risk": "MEDIUM"},
    },
}

# Environmental thresholds for disease prediction
DISEASE_THRESHOLDS = {
    "potato": [
        {"disease_id": 1, "condition": lambda t, h, r: t > 15 and t < 25 and h > 80 and r > 10,
         "description": "Cool + wet = Late Blight risk"},
        {"disease_id": 2, "condition": lambda t, h, r: t > 25 and t < 35 and h > 60,
         "description": "Warm + moderate humidity = Early Blight risk"},
        {"disease_id": 3, "condition": lambda t, h, r: t < 15 and h > 70,
         "description": "Cold + moist = Black Scurf risk"},
        {"disease_id": 5, "condition": lambda t, h, r: t > 30 and h > 85 and r > 20,
         "description": "Hot + very wet = Soft Rot risk"},
        {"disease_id": 4, "condition": lambda t, h, r: h < 50 and r < 5,
         "description": "Dry conditions = Common Scab risk"},
    ],
    "rice": [
        {"disease_id": 1, "condition": lambda t, h, r: t > 20 and t < 30 and h > 85 and r > 15,
         "description": "Warm + very humid = Rice Blast risk"},
        {"disease_id": 2, "condition": lambda t, h, r: t > 25 and h > 70 and r < 10,
         "description": "Warm + humid + dry spell = Brown Spot risk"},
        {"disease_id": 4, "condition": lambda t, h, r: t > 28 and h > 80 and r > 20,
         "description": "Hot + wet = Bacterial Blight risk"},
        {"disease_id": 5, "condition": lambda t, h, r: t > 25 and t < 35 and h > 75,
         "description": "Tropical warmth = Tungro risk"},
        {"disease_id": 3, "condition": lambda t, h, r: t > 25 and h > 90 and r > 30,
         "description": "Very humid + heavy rain = False Smut risk"},
    ],
    "tea": [
        {"disease_id": 1, "condition": lambda t, h, r: t > 18 and t < 25 and h > 85 and r > 10,
         "description": "Cool + misty = Blister Blight risk"},
        {"disease_id": 2, "condition": lambda t, h, r: t > 25 and h > 75,
         "description": "Warm + humid = Grey Blight risk"},
        {"disease_id": 3, "condition": lambda t, h, r: t > 22 and h > 80 and r > 20,
         "description": "Warm + wet = Red Rust risk"},
        {"disease_id": 4, "condition": lambda t, h, r: t > 28 and h > 70 and r < 5,
         "description": "Hot + dry = Anthracnose risk"},
    ],
    "makhana": [
        {"disease_id": 1, "condition": lambda t, h, r: h > 85 and t > 25,
         "description": "High humidity + warm = Leaf Blight risk"},
        {"disease_id": 2, "condition": lambda t, h, r: t > 35 or t < 15,
         "description": "Extreme temperature = Root Rot risk"},
        {"disease_id": 3, "condition": lambda t, h, r: t > 30 and h < 60,
         "description": "Hot + dry = Aphid Damage risk"},
        {"disease_id": 4, "condition": lambda t, h, r: t > 28 and h > 80 and r > 25,
         "description": "Hot + wet = Algal Infection risk"},
    ],
}


class WeatherPredictor:
    """Predicts crop diseases based on weather/environmental conditions."""

    def __init__(self, models_dir: str = None):
        self.potato_model = None
        self.rice_model = None
        self.models_dir = models_dir or os.path.join(os.path.dirname(__file__), "..", "saved_models")
        self._load_models()

    def _load_models(self):
        """Load existing .pkl models if available."""
        potato_path = os.path.join(self.models_dir, "potato_mega_model.pkl")
        rice_path = os.path.join(self.models_dir, "rice_mega_model.pkl")

        try:
            if os.path.exists(potato_path):
                self.potato_model = joblib.load(potato_path)
                print("✅ Potato weather prediction model loaded")
            else:
                print(f"⚠️ Potato model not found at {potato_path}")

            if os.path.exists(rice_path):
                self.rice_model = joblib.load(rice_path)
                print("✅ Rice weather prediction model loaded")
            else:
                print(f"⚠️ Rice model not found at {rice_path}")
        except Exception as e:
            print(f"❌ Error loading models: {e}")

    def predict(self, crop: str, temperature: float, humidity: float,
                rainfall: float, water_depth: float = 0.0) -> Dict[str, Any]:
        """
        Predict disease risk for a crop based on weather conditions.
        Returns predicted diseases with confidence scores.
        """
        crop = crop.lower()
        if crop not in DISEASE_INFO:
            return {"error": f"Unsupported crop: {crop}"}

        # Try ML model first (for potato/rice)
        ml_prediction = None
        if crop == "potato" and self.potato_model:
            ml_prediction = self._predict_with_model(
                self.potato_model, crop, temperature, humidity, rainfall
            )
        elif crop == "rice" and self.rice_model:
            ml_prediction = self._predict_with_model(
                self.rice_model, crop, temperature, humidity, rainfall
            )

        # Always run rule-based prediction for all crops
        rule_predictions = self._predict_with_rules(
            crop, temperature, humidity, rainfall, water_depth
        )

        # Combine results
        if ml_prediction and ml_prediction["disease_id"] != 0:
            primary = ml_prediction
            primary["method"] = "ML_MODEL"
        elif rule_predictions:
            primary = rule_predictions[0]
            primary["method"] = "RULE_BASED"
        else:
            primary = {
                "disease_id": 0,
                "confidence": 0.95,
                "method": "RULE_BASED",
            }

        disease_id = primary["disease_id"]
        disease_info = DISEASE_INFO[crop].get(disease_id, DISEASE_INFO[crop][0])

        return {
            "crop": crop,
            "disease_name": disease_info["name"],
            "confidence": round(primary["confidence"], 2),
            "treatment": disease_info["treatment"],
            "risk_level": disease_info["risk"],
            "prediction_method": primary["method"],
            "weather_input": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
                "water_depth": water_depth if crop == "makhana" else None,
            },
            "all_risks": [
                {
                    "disease": DISEASE_INFO[crop][r["disease_id"]]["name"],
                    "confidence": round(r["confidence"], 2),
                    "risk_level": DISEASE_INFO[crop][r["disease_id"]]["risk"],
                }
                for r in rule_predictions
            ] if rule_predictions else [],
        }

    def _predict_with_model(self, model, crop: str, temp: float,
                            humidity: float, rainfall: float) -> Optional[Dict]:
        """Use trained ML model for prediction."""
        try:
            features = np.array([[temp, humidity, rainfall]])
            prediction = int(model.predict(features)[0])

            # Calculate confidence from probability if available
            confidence = 0.85
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(features)[0]
                confidence = float(max(proba))

            return {"disease_id": prediction, "confidence": confidence}
        except Exception as e:
            print(f"ML model prediction error: {e}")
            return None

    def _predict_with_rules(self, crop: str, temp: float, humidity: float,
                            rainfall: float, water_depth: float = 0.0) -> list:
        """Rule-based disease prediction using environmental thresholds."""
        predictions = []
        thresholds = DISEASE_THRESHOLDS.get(crop, [])

        # Special makhana water depth rules
        if crop == "makhana":
            if water_depth < 0.3:
                predictions.append({"disease_id": 2, "confidence": 0.88,
                                    "reason": "Water depth too low (<0.3m)"})
            elif water_depth > 2.0:
                predictions.append({"disease_id": 2, "confidence": 0.82,
                                    "reason": "Water depth too high (>2.0m)"})

        for threshold in thresholds:
            if threshold["condition"](temp, humidity, rainfall):
                # Calculate confidence based on how strongly conditions match
                confidence = self._calculate_confidence(
                    crop, threshold["disease_id"], temp, humidity, rainfall
                )
                predictions.append({
                    "disease_id": threshold["disease_id"],
                    "confidence": confidence,
                    "reason": threshold["description"],
                })

        # Sort by confidence descending
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        return predictions

    def _calculate_confidence(self, crop: str, disease_id: int,
                              temp: float, humidity: float, rainfall: float) -> float:
        """Calculate confidence score based on how extreme the conditions are."""
        # Base confidence
        confidence = 0.65

        # Increase confidence for more extreme conditions
        if humidity > 90:
            confidence += 0.10
        elif humidity > 80:
            confidence += 0.05

        if rainfall > 30:
            confidence += 0.08
        elif rainfall > 15:
            confidence += 0.04

        if temp > 35 or temp < 10:
            confidence += 0.07

        return min(confidence, 0.95)
