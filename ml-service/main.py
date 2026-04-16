"""
Crop Disease Detection ML Service
FastAPI application serving CNN image models and weather-based prediction models.
"""

import os
import uuid
import shutil
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.weather_predictor import WeatherPredictor
from models.image_classifier import CropDiseaseClassifier

# ========================================
# App Configuration
# ========================================
app = FastAPI(
    title="Crop Disease ML Service",
    description="AI-powered crop disease detection and prediction API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# Initialize models
# ========================================
SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

weather_predictor = WeatherPredictor(models_dir=SAVED_MODELS_DIR)
image_classifier = CropDiseaseClassifier(models_dir=SAVED_MODELS_DIR)


# ========================================
# Request/Response Models
# ========================================
class WeatherPredictionRequest(BaseModel):
    crop: str
    temperature: float
    humidity: float
    rainfall: float
    water_depth: Optional[float] = 0.0


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: dict
    timestamp: str


# ========================================
# Endpoints
# ========================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="Crop Disease ML Service",
        version="1.0.0",
        models_loaded={
            "potato_weather": weather_predictor.potato_model is not None,
            "rice_weather": weather_predictor.rice_model is not None,
            "image_models": list(image_classifier.models.keys()),
        },
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/predict/weather")
async def predict_weather(request: WeatherPredictionRequest):
    """
    Predict possible crop diseases based on weather/environmental conditions.
    This predicts whether a plant COULD get a disease, not detect existing disease.
    """
    try:
        result = weather_predictor.predict(
            crop=request.crop,
            temperature=request.temperature,
            humidity=request.humidity,
            rainfall=request.rainfall,
            water_depth=request.water_depth or 0.0,
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return {
            "success": True,
            "prediction_type": "WEATHER_BASED",
            "data": result,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/image")
async def predict_image(
    crop: str = Form(...),
    image: UploadFile = File(...),
):
    """
    Detect crop disease from an uploaded leaf/plant image.
    Uses CNN (MobileNetV2) model for classification.
    """
    # Validate crop type
    valid_crops = ["potato", "rice", "tea", "makhana"]
    if crop.lower() not in valid_crops:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid crop type. Valid options: {valid_crops}",
        )

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Allowed: {allowed_types}",
        )

    try:
        # Read image bytes
        image_bytes = await image.read()

        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        if len(image_bytes) > 10 * 1024 * 1024:  # 10 MB limit
            raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

        # Save uploaded image
        file_ext = os.path.splitext(image.filename)[1] or ".jpg"
        saved_filename = f"{uuid.uuid4().hex}{file_ext}"
        saved_path = os.path.join(UPLOAD_DIR, saved_filename)
        with open(saved_path, "wb") as f:
            f.write(image_bytes)

        # Run prediction
        result = image_classifier.predict(crop.lower(), image_bytes)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return {
            "success": True,
            "prediction_type": "IMAGE_BASED",
            "data": result,
            "image_path": saved_filename,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image prediction failed: {str(e)}")


@app.get("/crops")
async def list_crops():
    """List all supported crops and their disease classes."""
    from models.image_classifier import CROP_CLASSES, TREATMENTS
    return {
        "crops": {
            crop: {
                "diseases": classes,
                "treatments": {d: TREATMENTS[crop][d] for d in classes},
            }
            for crop, classes in CROP_CLASSES.items()
        }
    }


# ========================================
# Run server
# ========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
