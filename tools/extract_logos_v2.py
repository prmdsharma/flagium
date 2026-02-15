import cv2
import numpy as np
import os

def merge_boxes(boxes, distance_threshold=100):
    if not boxes:
        return []

    # Format: [x, y, w, h]
    merged_boxes = []
    
    # Sort by Y then X to process in order
    boxes.sort(key=lambda b: (b[1], b[0]))
    
    consumed = [False] * len(boxes)
    
    for i in range(len(boxes)):
        if consumed[i]:
            continue
            
        current_cluster = [boxes[i]]
        consumed[i] = True
        
        # Iteratively add boxes that are close to the cluster
        changed = True
        while changed:
            changed = False
            for j in range(len(boxes)):
                if consumed[j]:
                    continue
                
                # Check distance to any box in cluster
                bx, by, bw, bh = boxes[j]
                
                is_close = False
                for cx, cy, cw, ch in current_cluster:
                    # Calculate distance between rectangles (simplistic)
                    # Check horizontal and vertical gaps
                    
                    # Horizontal gap
                    dx = max(0, max(bx, cx) - min(bx + bw, cx + cw))
                    # Vertical gap
                    dy = max(0, max(by, cy) - min(by + bh, cy + ch))
                    
                    if dx < distance_threshold and dy < distance_threshold:
                        is_close = True
                        break
                
                if is_close:
                    current_cluster.append(boxes[j])
                    consumed[j] = True
                    changed = True
        
        # Merge cluster into one box
        min_x = min(b[0] for b in current_cluster)
        min_y = min(b[1] for b in current_cluster)
        max_x = max(b[0] + b[2] for b in current_cluster)
        max_y = max(b[1] + b[3] for b in current_cluster)
        
        merged_boxes.append((min_x, min_y, max_x - min_x, max_y - min_y))

    return merged_boxes

def extract_logos(image_path, output_dir):
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Error loading image")
        return

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Grayscale & Thresh
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        _, mask = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter noise
    min_area = 50 
    valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_area]
    
    # Get raw boxes
    raw_boxes = [cv2.boundingRect(cnt) for cnt in valid_contours]
    
    # Merge nearby boxes
    final_boxes = merge_boxes(raw_boxes, distance_threshold=80) # 80px threshold

    print(f"Found {len(final_boxes)} merged logo objects.")

    # Sort merged boxes
    final_boxes.sort(key=lambda b: (b[1], b[0]))

    filenames = []
    
    for i, (x, y, w, h) in enumerate(final_boxes):
        pad = 5
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img.shape[1], x + w + pad)
        y2 = min(img.shape[0], y + h + pad)
        
        crop = img[y1:y2, x1:x2]
        
        # Heuristics
        aspect = w / h
        # Icon should be roughly square and large
        # Full logo is wide
        # Small icon is small
        
        if aspect > 1.5:
            filename = "logo-full.png"
        elif w > 100:
            filename = "logo-icon.png"
        elif w < 80 and h < 80:
            filename = "logo-small.png"
        else:
            filename = f"logo_unknown_{i}.png"

        if filename in filenames:
             base, ext = os.path.splitext(filename)
             filename = f"{base}_{i}{ext}"
             
        filenames.append(filename)
        cv2.imwrite(os.path.join(output_dir, filename), crop)
        print(f"Saved {filename} ({w}x{h})")

if __name__ == "__main__":
    extract_logos(
        "/Users/pramodsharma/.gemini/antigravity/brain/15fb1148-17a1-409b-b9d0-0064350805bf/media__1771066299962.png",
        "/Users/pramodsharma/PycharmProjects/flagium/ui/src/assets"
    )
