"""
CNN Model Training Pipeline
Train disease classification models for each crop using transfer learning.
"""

import os
import sys
import argparse
import numpy as np

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_data_generators(data_dir: str, img_size: tuple = (224, 224), batch_size: int = 32):
    """Create training and validation data generators with augmentation."""
    import tensorflow as tf

    train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode="nearest",
        validation_split=0.2,
    )

    train_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )

    val_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )

    return train_generator, val_generator


def train_model(crop: str, data_dir: str, epochs: int = 30, batch_size: int = 32):
    """Train a CNN model for a specific crop."""
    import tensorflow as tf
    from models.image_classifier import build_model

    print(f"\n{'='*60}")
    print(f"  Training {crop.upper()} Disease Classification Model")
    print(f"{'='*60}\n")

    # Create data generators
    crop_data_dir = os.path.join(data_dir, crop)
    if not os.path.exists(crop_data_dir):
        print(f"❌ Data directory not found: {crop_data_dir}")
        print(f"   Expected structure: {crop_data_dir}/Healthy/, {crop_data_dir}/Early_Blight/, etc.")
        return None

    train_gen, val_gen = create_data_generators(crop_data_dir, batch_size=batch_size)
    num_classes = train_gen.num_classes
    print(f"📊 Found {train_gen.samples} training and {val_gen.samples} validation images")
    print(f"📊 Number of classes: {num_classes}")
    print(f"📊 Class indices: {train_gen.class_indices}")

    # Build model
    model = build_model(num_classes)
    model.summary()

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7
        ),
        tf.keras.callbacks.ModelCheckpoint(
            os.path.join("saved_models", f"{crop}_cnn_model_best.keras"),
            monitor="val_accuracy",
            save_best_only=True,
        ),
    ]

    # Phase 1: Train top layers
    print("\n🔄 Phase 1: Training top layers (base frozen)...")
    history1 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=min(epochs, 10),
        callbacks=callbacks,
    )

    # Phase 2: Fine-tune - unfreeze last 30 layers of base model
    print("\n🔄 Phase 2: Fine-tuning (unfreezing base layers)...")
    base_model = model.layers[0]
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history2 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=epochs,
        initial_epoch=len(history1.history["loss"]),
        callbacks=callbacks,
    )

    # Evaluate
    val_loss, val_accuracy = model.evaluate(val_gen)
    print(f"\n✅ Final Validation Accuracy: {val_accuracy:.4f}")
    print(f"✅ Final Validation Loss: {val_loss:.4f}")

    # Save model
    save_path = os.path.join("saved_models", f"{crop}_cnn_model")
    model.save(save_path)
    print(f"💾 Model saved to: {save_path}")

    return model


def main():
    parser = argparse.ArgumentParser(description="Train crop disease models")
    parser.add_argument("--crop", type=str, required=True,
                        choices=["potato", "rice", "tea", "makhana", "all"],
                        help="Crop to train model for")
    parser.add_argument("--data-dir", type=str, required=True,
                        help="Path to dataset directory")
    parser.add_argument("--epochs", type=int, default=30,
                        help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32,
                        help="Batch size for training")

    args = parser.parse_args()

    os.makedirs("saved_models", exist_ok=True)

    crops = ["potato", "rice", "tea", "makhana"] if args.crop == "all" else [args.crop]

    for crop in crops:
        train_model(crop, args.data_dir, args.epochs, args.batch_size)

    print("\n🎉 Training complete!")


if __name__ == "__main__":
    main()
