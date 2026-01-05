import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class Matcher:
    @staticmethod
    def verify(new_vector, stored_vectors, current_hand_type=None, enrolled_hand_type=None):
        """
        SENIOR-LEVEL VERIFICATION: Triple-Gate Security + Hand Type Enforcement
        """
        if not stored_vectors or len(stored_vectors) < 1:
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

        new_vec = np.array(new_vector).reshape(1, -1)
        stored_vecs = np.array(stored_vectors)

        # Gate 0: Dimension Check
        if stored_vecs.shape[1] != new_vec.shape[1]:
            # This triggers the "re-register" flow in the route
            return "re-register", {}

        # Gate 1: Individual Vector Consensus (Identity persistence)
        similarities = cosine_similarity(new_vec, stored_vecs)[0]
        sorted_sims = sorted(similarities, reverse=True)
        top_3 = sorted_sims[:3]
        # Rule 5: Reject if similarity score is below 0.88 (We use 0.94 for higher safety)
        pass_top_3 = sum(1 for s in top_3 if s >= 0.94) >= 2

        # Gate 2: Centroid Check (Profile integrity)
        centroid = np.mean(stored_vecs, axis=0).reshape(1, -1)
        centroid_sim = cosine_similarity(new_vec, centroid)[0][0]
        pass_centroid = centroid_sim >= 0.95

        # Gate 3: Variance Gate (Anti-Imposter Statistics)
        user_mean = np.mean(stored_vecs, axis=0)
        user_std = np.std(stored_vecs, axis=0)
        user_std = np.where(user_std < 0.01, 0.01, user_std)
        
        z_scores = np.abs((new_vector - user_mean) / user_std)
        avg_z = np.mean(z_scores)
        # Rule 9: Reject if uncertainty persists (Z-score < 1.8 for extreme strictness)
        pass_variance = avg_z < 1.8 

        # FINAL DECISION: ALL GATES MUST PASS
        is_verified = pass_top_3 and pass_centroid and pass_variance

        # Rule 9 Enforcement: If confidence is uncertain, REJECT
        confidence = float(centroid_sim)
        
        result = {
            "status": "VERIFIED" if is_verified else "REJECTED",
            "reason": "Identity confirmed via 51D skeletal map." if is_verified else "Biometric validation failed. Geometry mismatch detected.",
            "confidence_score": confidence if is_verified else min(confidence, 0.45)
        }

        telemetry = {
            "cosine_top_3": [float(s) for s in top_3],
            "centroid_sim": float(centroid_sim),
            "avg_z": float(avg_z),
            "gates": {
                "top_3": bool(pass_top_3),
                "centroid": bool(pass_centroid),
                "variance": bool(pass_variance)
            }
        }

        print(f"--- STRICT SECURITY AUDIT ---")
        print(f"Result: {result['status']} | Confidence: {result['confidence_score']:.4f}")
        print(f"Reason: {result['reason']}")
        return result, telemetry
