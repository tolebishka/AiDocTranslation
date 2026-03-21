"""OCR service using Google Cloud Vision."""

import os
from google.cloud import vision
from dotenv import load_dotenv

load_dotenv()

# Инициализация клиента
client = vision.ImageAnnotatorClient()


def extract_text_from_document(file_path: str):
    """Extract text from local image using Google Vision OCR."""

    with open(file_path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    response = client.text_detection(image=image)

    if response.error.message:
        raise Exception(f"Vision API error: {response.error.message}")

    texts = response.text_annotations

    if not texts:
        return {
            "raw_text": "",
            "blocks": []
        }

    # Первый элемент — это весь текст целиком
    full_text = texts[0].description

    # Остальные — отдельные куски
    blocks = []
    for text in texts[1:]:
        blocks.append({
            "text": text.description,
            "bounds": [(v.x, v.y) for v in text.bounding_poly.vertices]
        })

    return {
        "raw_text": full_text,
        "blocks": blocks
    }