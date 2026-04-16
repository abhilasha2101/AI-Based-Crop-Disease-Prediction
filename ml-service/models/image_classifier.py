"""
CNN-based Crop Disease Image Classifier
Uses MobileNetV2 transfer learning for image classification.
Supports: Rice, Tea, Makhana, Potato
"""

import os
import numpy as np
from typing import Dict, Any, Optional, Tuple
from PIL import Image
import io


# Disease classes per crop
CROP_CLASSES = {
    "potato": [
        "Healthy",
        "Early Blight",
        "Late Blight",
        "Black Scurf",
        "Common Scab",
    ],
    "rice": [
        "Healthy",
        "Rice Blast",
        "Brown Spot",
        "False Smut",
        "Bacterial Blight",
    ],
    "tea": [
        "Healthy",
        "Blister Blight",
        "Grey Blight",
        "Red Rust",
        "Anthracnose",
    ],
    "makhana": [
        "Healthy",
        "Leaf Blight",
        "Root Rot",
        "Aphid Damage",
        "Algal Infection",
    ],
}

# Treatment recommendations for each disease
TREATMENTS = {
    "potato": {
        "Healthy": "No action needed. Plant is healthy.",
        "Early Blight": "Apply Chlorothalonil or Mancozeb fungicide. Remove infected leaves. Rotate crops.",
        "Late Blight": "Spray Mancozeb (2.5g/L) or Metalaxyl. Ensure proper drainage. Destroy infected plants.",
        "Black Scurf": "Treat seed tubers with Boric Acid 3%. Use certified disease-free seed.",
        "Common Scab": "Maintain soil pH 5.0-5.2. Irrigate regularly. Use resistant varieties.",
    },
    "rice": {
        "Healthy": "No action needed. Plant is healthy.",
        "Rice Blast": "Apply Tricyclazole 75 WP (0.6g/L). Reduce nitrogen. Use resistant varieties.",
        "Brown Spot": "Spray Propiconazole (1ml/L). Apply balanced NPK fertilizer.",
        "False Smut": "Spray Copper Hydroxide at booting stage. Avoid late nitrogen application.",
        "Bacterial Blight": "Drain field. Apply Streptocycline. Use resistant varieties.",
    },
    "tea": {
        "Healthy": "No action needed. Plant is healthy.",
        "Blister Blight": "Spray Copper Oxychloride (0.25%). Prune affected bushes. Ensure air circulation.",
        "Grey Blight": "Apply Mancozeb spray. Remove affected leaves. Reduce shade density.",
        "Red Rust": "Spray Bordeaux mixture 1%. Improve drainage. Reduce overhead shade.",
        "Anthracnose": "Apply Copper-based fungicides. Prune dead branches. Avoid water stress.",
    },
    "makhana": {
        "Healthy": "No action needed. Plant is healthy.",
        "Leaf Blight": "Spray Neem Oil (5ml/L). Ensure proper water circulation in pond.",
        "Root Rot": "Maintain water depth 0.5-1.5m. Improve water quality. Remove dead organic matter.",
        "Aphid Damage": "Apply Imidacloprid (0.3ml/L). Introduce beneficial insects.",
        "Algal Infection": "Apply Copper Sulphate (1g/1000L water). Control nutrient runoff.",
    },
}

# Image preprocessing constants
IMG_SIZE = (224, 224)
NORMALIZATION_MEAN = [0.485, 0.456, 0.406]
NORMALIZATION_STD = [0.229, 0.224, 0.225]


class CropDiseaseClassifier:
    """CNN-based image classification for crop disease detection."""

    def __init__(self, models_dir: str = None):
        self.models_dir = models_dir or os.path.join(
            os.path.dirname(__file__), "..", "saved_models"
        )
        self.models = {}
        self._load_models()

    def _load_models(self):
        """Load saved CNN models for each crop."""
        for crop in CROP_CLASSES.keys():
            model_path = os.path.join(self.models_dir, f"{crop}_cnn_model")
            if os.path.exists(model_path):
                try:
                    import tensorflow as tf
                    self.models[crop] = tf.keras.models.load_model(model_path)
                    print(f"✅ {crop.title()} CNN model loaded from {model_path}")
                except Exception as e:
                    print(f"⚠️ Could not load {crop} CNN model: {e}")
            else:
                print(f"ℹ️ {crop.title()} CNN model not found at {model_path} — using simulation mode")

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """Preprocess image for model input."""
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
        image = image.resize(IMG_SIZE, Image.LANCZOS)

        # Convert to numpy array and normalize
        img_array = np.array(image, dtype=np.float32) / 255.0

        # Apply ImageNet normalization
        for i in range(3):
            img_array[:, :, i] = (img_array[:, :, i] - NORMALIZATION_MEAN[i]) / NORMALIZATION_STD[i]

        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    def predict(self, crop: str, image_bytes: bytes) -> Dict[str, Any]:
        """Classify a crop disease from an image."""
        crop = crop.lower()
        if crop not in CROP_CLASSES:
            return {"error": f"Unsupported crop type: {crop}"}

        classes = CROP_CLASSES[crop]

        # Preprocess image
        try:
            img_array = self.preprocess_image(image_bytes)
        except Exception as e:
            return {"error": f"Image preprocessing failed: {str(e)}"}

        # Use trained model if available, otherwise simulate
        if crop in self.models:
            predictions = self._predict_with_model(crop, img_array)
        else:
            predictions = self._simulate_prediction(crop, img_array)

        # Get top prediction
        top_idx = int(np.argmax(predictions))
        confidence = float(predictions[top_idx])
        disease_name = classes[top_idx]
        treatment = TREATMENTS[crop].get(disease_name, "Consult an agricultural expert.")

        # Build all predictions list
        all_predictions = []
        sorted_indices = np.argsort(predictions)[::-1]
        for idx in sorted_indices:
            all_predictions.append({
                "disease": classes[idx],
                "confidence": round(float(predictions[idx]), 4),
                "treatment": TREATMENTS[crop].get(classes[idx], ""),
            })

        return {
            "crop": crop,
            "disease_name": disease_name,
            "confidence": round(confidence, 4),
            "treatment": treatment,
            "risk_level": "LOW" if disease_name == "Healthy" else ("HIGH" if confidence > 0.7 else "MEDIUM"),
            "all_predictions": all_predictions,
            "model_type": "CNN" if crop in self.models else "SIMULATED",
        }

    def _predict_with_model(self, crop: str, img_array: np.ndarray) -> np.ndarray:
        """Run actual CNN model inference."""
        model = self.models[crop]
        predictions = model.predict(img_array, verbose=0)[0]
        return predictions

    def _simulate_prediction(self, crop: str, img_array: np.ndarray) -> np.ndarray:
        """
        Simulate prediction when no trained model is available.
        Uses image statistics to generate deterministic but varied results.
        """
        num_classes = len(CROP_CLASSES[crop])

        # Use image features to generate consistent predictions
        mean_values = np.mean(img_array[0], axis=(0, 1))
        pixel_std = np.std(img_array[0])

        # Generate pseudo-probabilities from image statistics
        np.random.seed(int(abs(mean_values[0] * 1000)))
        raw_probs = np.random.dirichlet(np.ones(num_classes) * 2)

        # Boost a particular class based on image characteristics
        dominant_class = int(abs(mean_values[1] * 10)) % num_classes
        raw_probs[dominant_class] += 0.3
        raw_probs /= raw_probs.sum()

        return raw_probs


def build_model(num_classes: int) -> "tf.keras.Model":
    """
    Build a MobileNetV2-based transfer learning model.
    Call this to create a model architecture for training.
    """
    import tensorflow as tf

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # Freeze base layers initially

    model = tf.keras.Sequential([
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(256, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model
