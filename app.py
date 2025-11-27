from flask import Flask, render_template, request, jsonify
import joblib
import random
import os

app = Flask(__name__)

# ==================================================
# 1. LOAD MODELS (With Error Safety)
# ==================================================
potato_model = None
rice_model = None

def load_models():
    global potato_model, rice_model
    try:
        if os.path.exists('potato_mega_model.pkl'):
            potato_model = joblib.load('potato_mega_model.pkl')
            print("✅ Potato Model Loaded")
        else:
            print("⚠️ Warning: 'potato_mega_model.pkl' not found.")
        
        if os.path.exists('rice_mega_model.pkl'):
            rice_model = joblib.load('rice_mega_model.pkl')
            print("✅ Rice Model Loaded")
        else:
            print("⚠️ Warning: 'rice_mega_model.pkl' not found.")
            
    except Exception as e:
        print(f"❌ Error loading models: {e}")

load_models()
# ==================================================
# 2. DISEASE DATABASE (5 Types per Crop)
# ==================================================
DISEASE_INFO = {
    "potato": {
        0: {"name": "Healthy", "cure": "No action needed.", "img": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400"},
        1: {"name": "Late Blight", "cure": "Spray Mancozeb (2.5g/L).", "img": "https://upload.wikimedia.org/wikipedia/commons/3/33/Phytophthora_infestans_potato.jpg"},
        2: {"name": "Early Blight", "cure": "Spray Copper Oxychloride.", "img": "https://extension.umn.edu/sites/extension.umn.edu/files/styles/large/public/early-blight-potato-leaf.jpg"},
        3: {"name": "Black Scurf", "cure": "Treat seeds with Boric Acid.", "img": "https://www.agric.wa.gov.au/sites/gateway/files/styles/original/public/Black%20scurf%20on%20potato.jpg"},
        4: {"name": "Common Scab", "cure": "Irrigate field to stop bacteria.", "img": "https://cdn.shopify.com/s/files/1/0059/8835/2052/files/Potato_Scab_1_480x480.jpg"},
        5: {"name": "Soft Rot", "cure": "Remove rotting plants.", "img": "https://ahdb.org.uk/media/3233/blackleg-soft-rot-potato-tuber.jpg"}
    },
    "rice": {
        0: {"name": "Healthy", "cure": "No action needed.", "img": "https://images.unsplash.com/photo-1536617621972-060232d3269b?w=400"},
        1: {"name": "Rice Blast", "cure": "Apply Tricyclazole 75 WP.", "img": "https://www.irri.org/sites/default/files/styles/science_domain_image/public/blast-leaf-symptoms.jpg"},
        2: {"name": "Brown Spot", "cure": "Spray Propiconazole.", "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Brown_spot_of_rice_1.jpg/640px-Brown_spot_of_rice_1.jpg"},
        3: {"name": "False Smut", "cure": "Spray Copper Hydroxide.", "img": "https://www.agric.wa.gov.au/sites/gateway/files/styles/original/public/False%20smut%20rice.jpg"},
        4: {"name": "Bacterial Blight", "cure": "Drain field. Apply Streptocycline.", "img": "https://www.irri.org/sites/default/files/styles/science_domain_image/public/bacterial-blight-leaf-symptoms.jpg"},
        5: {"name": "Tungro Virus", "cure": "Control Leafhoppers.", "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Rice_Tungro_Disease.jpg/640px-Rice_Tungro_Disease.jpg"}
    }
}
# ==================================================
# 3. WEBSITE PAGES (ROUTES)
# ==================================================
@app.route('/')
def home_page():
    return render_template('home.html')

@app.route('/tool')
def prediction_tool():
    return render_template('tool.html')

@app.route('/resources')
def resources_page():
    return render_template('resources.html')

# ==================================================
# 4. PREDICTION API (Handles the Logic)
# ==================================================
@app.route('/predict_api', methods=['POST'])
def predict_api():
    # 1. Get Data from Website Inputs
    data = request.json
    crop = data.get('crop')
    
    try:
        temp = float(data.get('temp'))
        humidity = float(data.get('humidity'))
        rain = float(data.get('rain'))
        depth = float(data.get('depth', 0))
    except:
        return jsonify({"error": "Invalid numbers input"}), 400

    result = {}

    # --- A. MAKHANA LOGIC (Expert Rules) ---
    if crop == "makhana":
        if depth < 0.3:
            result = {"disease": "Root Rot Risk", "cure": "Water too low (<0.3m). Add water.", "status": "High Risk", "image": "https://agritech.tnau.ac.in/fishery/images/makhana/makhana_crop.jpg"}
        elif depth > 2.0:
            result = {"disease": "Submersion Risk", "cure": "Water too high. Reduce depth.", "status": "High Risk", "image": "https://agritech.tnau.ac.in/fishery/images/makhana/makhana_crop.jpg"}
        elif temp > 35:
            result = {"disease": "Heat Stress", "cure": "Ensure water circulation.", "status": "High Risk", "image": "https://agritech.tnau.ac.in/fishery/images/makhana/makhana_harvest.jpg"}
        elif humidity > 85 and temp > 25:
            result = {"disease": "Leaf Blight", "cure": "High Humidity. Spray Neem Oil.", "status": "High Risk", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Alternaria_alternata_on_leaf.JPG/640px-Alternaria_alternata_on_leaf.JPG"}
        else:
            result = {"disease": "Healthy", "cure": "Conditions Optimal.", "status": "Safe", "image": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400"}

    # --- B. POTATO & RICE LOGIC (ML Models) ---
    elif crop in ["potato", "rice"]:
        model = potato_model if crop == "potato" else rice_model
        
        if model:
            # Predict using the .pkl file
            pred = model.predict([[temp, humidity, rain]])[0]
            
            # Get info from Dictionary
            info = DISEASE_INFO[crop].get(pred, DISEASE_INFO[crop][0])
            
            result['disease'] = info['name']
            result['cure'] = info['cure']
            result['image'] = info['img']
            result['status'] = "Safe" if pred == 0 else "High Risk"
        else:
            result = {"disease": "Error", "cure": "Model file missing on server.", "status": "Error", "image": ""}

    # --- C. SATELLITE NDVI CALCULATION ---
    # Smart Simulation: If disease risk is high, lower the NDVI score
    if result.get('status') == "High Risk":
        base_ndvi = random.uniform(0.3, 0.5) 
        sat_status = "Stressed"
    else:
        base_ndvi = random.uniform(0.6, 0.9)
        sat_status = "Healthy"
        
    nir = round(base_ndvi + 0.1, 2)
    red = round(base_ndvi - 0.1, 2)
    final_ndvi = round((nir - red) / (nir + red), 2)
    
    result['ndvi'] = final_ndvi
    result['satellite_status'] = sat_status

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)