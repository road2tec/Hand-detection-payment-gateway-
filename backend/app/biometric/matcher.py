import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class Matcher:
    @staticmethod
    def verify(new_geo, stored_geo, new_cnn=None, stored_cnn=None, current_hand_type=None, enrolled_hand_type=None):
        """
        SENIOR-LEVEL VERIFICATION: Hybrid Fusion (Geometric + CNN)
        """
        if not stored_geo or len(stored_geo) < 1:
            return {
                "status": "REJECTED",
                "reason": "Biometric profile empty or corrupt.",
                "confidence_score": 0.0
            }, {}

        # Rule 3: Reject immediately if hand type differs
        if current_hand_type and enrolled_hand_type and current_hand_type != enrolled_hand_type:
             return {
                "status": "REJECTED",
                "reason": f"Skeletal Mismatch: Enrolled hand is {enrolled_hand_type}, but {current_hand_type} hand was detected.",
                "confidence_score": 0.1
            }, {}

        # --- GEOMETRIC MATCHING (Dominant: 70%) ---
        new_vec = np.array(new_geo).reshape(1, -1)
        stored_vecs = np.array(stored_geo)

        # Gate 0: Dimension Check
        if stored_vecs.shape[1] != new_vec.shape[1]:
            return "re-register", {}

        # Gate 1: Individual Vector Consensus
        geo_similarities = cosine_similarity(new_vec, stored_vecs)[0]
        geo_top_3 = sorted(geo_similarities, reverse=True)[:3]
        
        # Gate 2: Centroid Check
        centroid = np.mean(stored_vecs, axis=0).reshape(1, -1)
        geo_centroid_sim = cosine_similarity(new_vec, centroid)[0][0]

        # Gate 3: Variance Gate
        user_mean = np.mean(stored_vecs, axis=0)
        user_std = np.std(stored_vecs, axis=0)
        user_std = np.where(user_std < 0.01, 0.01, user_std)
        z_scores = np.abs((new_geo - user_mean) / user_std)
        avg_z = np.mean(z_scores)

        geo_score = float(geo_centroid_sim)
        
        # --- CNN MATCHING (Supportive: 30%) ---
        cnn_score = 0.0
        cnn_pass = False
        
        if new_cnn and stored_cnn and len(stored_cnn) > 0:
            new_cnn_vec = np.array(new_cnn).reshape(1, -1)
            stored_cnn_vecs = np.array(stored_cnn)
            
            cnn_similarities = cosine_similarity(new_cnn_vec, stored_cnn_vecs)[0]
            # Use max similarity for CNN (best match strategy)
            cnn_score = float(np.max(cnn_similarities))
            
            # CNN Pass Threshold (MobileNet features are usually robust)
            cnn_pass = cnn_score > 0.85
        else:
            # Fallback if CNN features missing (Legacy users)
            cnn_score = geo_score 
            cnn_pass = True 

        # --- SCORE LEVEL FUSION ---
        # Formula: Final Score = (w1 * Geometric) + (w2 * CNN)
        # We prioritize Geometric (70%) because it measures physical anatomy (bones), 
        # while CNN (30%) measures skin texture.
        # This Hybrid approach is harder to spoof than either method alone.
        final_score = (0.7 * geo_score) + (0.3 * cnn_score)

        # --- DECISION LOGIC ---
        # 1. Geometric Consistency
        # ENFORCED: Threshold 0.90 -> 0.95 | Z-score 3.5 -> 2.5
        # This prevents "False Acceptance" of similar-sized hands.
        geo_pass = (sum(1 for s in geo_top_3 if s >= 0.94) >= 2) and (geo_centroid_sim >= 0.95) and (avg_z < 2.5)
        
        # 2. Final Verified Status (ENFORCED: 0.88 -> 0.93)
        # 93% is the "Gold Standard" for production biometric systems with these feature sets.
        is_verified = geo_pass and cnn_pass and (final_score > 0.93)

        reason = "Hybrid Identity Confirmed." if is_verified else "Identity Verification Failed."
        if not is_verified:
            if final_score > 0.88:
                reason = "Borderline match. Ensure your palm is fully flat and centrally aligned."
            elif final_score > 0.80:
                reason = "Low confidence match. Lighting or orientation may be suboptimal."
            else:
                reason = "Identity Mismatch. The scanned handprint does not align with the secure profile."

        result = {
            "status": "VERIFIED" if is_verified else "REJECTED",
            "reason": reason,
            "confidence_score": final_score
        }

        telemetry = {
            "geo_score": geo_score,
            "cnn_score": cnn_score,
            "final_score": final_score,
            "avg_z_score": float(avg_z),
            "cnn_available": bool(new_cnn)
        }

        print(f"--- HYBRID SECURITY AUDIT ---")
        print(f"Geo: {geo_score:.4f} | CNN: {cnn_score:.4f} | Final: {final_score:.4f}")
        print(f"Result: {result['status']}")

        return result, telemetry
