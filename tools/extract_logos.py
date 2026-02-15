import cv2
import numpy as np
import os

def extract_logos(image_path, output_dir):
    # Load image
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Error: Could not load image at {image_path}")
        return

    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Convert to grayscale for thresholding
    if img.shape[2] == 4:
        # Has alpha channel
        alpha = img[:, :, 3]
        gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
        # Use alpha channel as mask if present
        mask = alpha > 0
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Assume white background if no alpha
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

    # Find contours
    contours, hierarchy = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter contours based on area to remove noise
    min_area = 1000 # adjust based on image size
    valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_area]

    print(f"Found {len(valid_contours)} potential logo objects.")

    # Sort contours by position (top-to-bottom, left-to-right)
    # bounding box: (x, y, w, h)
    boxes = [cv2.boundingRect(cnt) for cnt in valid_contours]
    # Simple sort by Y then X
    boxes.sort(key=lambda b: (b[1] // 50, b[0])) # Bin Y by 50px to handle slight misalignments

    filenames = []
    
    for i, (x, y, w, h) in enumerate(boxes):
        # Add padding
        pad = 0
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img.shape[1], x + w + pad)
        y2 = min(img.shape[0], y + h + pad)

        crop = img[y1:y2, x1:x2]
        
        # Determine likely logo type based on aspect ratio
        aspect = w / h
        filename = f"logo_{i+1}.png"
        
        if aspect > 2.0:
            filename = "logo-full.png"
        elif aspect > 0.8 and aspect < 1.2 and w > 100:
            filename = "logo-icon.png" # Large square
        elif aspect > 0.8 and aspect < 1.2 and w <= 100:
            filename = "logo-small.png" # Small square / Favicon
        else:
             filename = f"logo_unknown_{i}.png"

        # Handle duplicates if multiple match same criteria (append index)
        if filename in filenames:
            base, ext = os.path.splitext(filename)
            filename = f"{base}_{i}{ext}"
        
        filenames.append(filename)

        out_path = os.path.join(output_dir, filename)
        cv2.imwrite(out_path, crop)
        print(f"Saved {filename} ({w}x{h})")

if __name__ == "__main__":
    extract_logos(
        "/Users/pramodsharma/.gemini/antigravity/brain/15fb1148-17a1-409b-b9d0-0064350805bf/media__1771066299962.png",
        "/Users/pramodsharma/PycharmProjects/flagium/ui/src/assets"
    )
